#!/usr/bin/env python3
"""
UniversalSMARTAgent - Cross-platform agent for Windows, Linux, and macOS
Detects platform-specific information and broadcasts to SMART-Admin
"""

import json
import socket
import time
import platform
import threading
import logging
import os
import subprocess
import shutil
import psutil
from typing import Dict, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('UniversalSMARTAgent')

class UniversalSMARTAgent:
    """Universal agent that works on Windows, Linux, and macOS"""
    
    def __init__(self):
        self.running = False
        self.hostname = socket.gethostname()
        self.local_ip = self.get_local_ip()
        self.platform_info = self.detect_platform_info()
        
    def get_local_ip(self) -> str:
        """Get local IP address"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except:
            return '127.0.0.1'
    
    def get_windows_version(self) -> str:
        """Get detailed Windows version"""
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                               r"SOFTWARE\Microsoft\Windows NT\CurrentVersion")
            
            try:
                # Get build number first to determine Windows 11
                build_number = winreg.QueryValueEx(key, "CurrentBuild")[0]
                build_int = int(build_number)
                
                # Windows 11 detection (build 22000+)
                if build_int >= 22000:
                    # Check for Windows 11 specific registry entry
                    try:
                        display_version = winreg.QueryValueEx(key, "DisplayVersion")[0]
                        return f"Windows 11 {display_version} (Build {build_number})"
                    except:
                        return f"Windows 11 (Build {build_number})"
                else:
                    # Windows 10 or earlier
                    try:
                        product_name = winreg.QueryValueEx(key, "ProductName")[0]
                        
                        # Try to get release ID for Windows 10
                        try:
                            release_id = winreg.QueryValueEx(key, "ReleaseId")[0]
                            return f"{product_name} {release_id} (Build {build_number})"
                        except:
                            try:
                                display_version = winreg.QueryValueEx(key, "DisplayVersion")[0]
                                return f"{product_name} {display_version} (Build {build_number})"
                            except:
                                return f"{product_name} (Build {build_number})"
                    except:
                        return f"Windows (Build {build_number})"
            finally:
                winreg.CloseKey(key)
        except:
            return f"Windows {platform.release()}"
    
    def get_linux_distribution(self) -> str:
        """Get Linux distribution information"""
        try:
            # Try reading /etc/os-release
            if os.path.exists('/etc/os-release'):
                with open('/etc/os-release', 'r') as f:
                    lines = f.readlines()
                    os_info = {}
                    for line in lines:
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            os_info[key] = value.strip('"')
                    
                    pretty_name = os_info.get('PRETTY_NAME')
                    if pretty_name:
                        return pretty_name
                    
                    name = os_info.get('NAME', 'Linux')
                    version = os_info.get('VERSION', '')
                    return f"{name} {version}".strip()
            
            # Fallback methods
            try:
                result = subprocess.run(['lsb_release', '-d'], capture_output=True, text=True)
                if result.returncode == 0:
                    return result.stdout.split(':', 1)[1].strip()
            except:
                pass
                
        except Exception as e:
            logger.debug(f"Linux distribution detection failed: {e}")
        
        return f"Linux {platform.release()}"
    
    def get_macos_version(self) -> str:
        """Get macOS version information"""
        try:
            result = subprocess.run(['sw_vers'], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                version_info = {}
                for line in lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        version_info[key.strip()] = value.strip()
                
                product_name = version_info.get('ProductName', 'macOS')
                product_version = version_info.get('ProductVersion', '')
                return f"{product_name} {product_version}".strip()
        except:
            pass
        
        return f"macOS {platform.mac_ver()[0]}"
    
    def get_device_model(self) -> Optional[str]:
        """Try to get device model/manufacturer information"""
        system = platform.system().lower()
        
        # Define generic/placeholder values that should be ignored
        generic_values = [
            'System Product Name', 
            'To be filled by O.E.M.', 
            'To Be Filled By O.E.M.',
            'Default string',
            'Not Specified',
            'Not Available',
            'O.E.M',
            'OEM',
            'System Product',
            'Computer'
        ]
        
        try:
            if system == 'windows':
                # Method 1: Try WMIC for BaseBoard (motherboard) info first
                try:
                    result = subprocess.run(['wmic', 'baseboard', 'get', 'manufacturer,product', '/value'], 
                                          capture_output=True, text=True, timeout=10)
                    if result.returncode == 0:
                        manufacturer = ''
                        product = ''
                        for line in result.stdout.split('\n'):
                            line = line.strip()
                            if line.startswith('Manufacturer='):
                                manufacturer = line.split('=', 1)[1].strip()
                            elif line.startswith('Product='):
                                product = line.split('=', 1)[1].strip()
                        
                        if manufacturer and product and product not in generic_values:
                            return f"{manufacturer} {product}"
                except:
                    pass
                
                # Method 2: Try computer system info with better validation
                try:
                    result = subprocess.run(['wmic', 'computersystem', 'get', 'manufacturer,model', '/value'], 
                                          capture_output=True, text=True, timeout=10)
                    if result.returncode == 0:
                        manufacturer = ''
                        model = ''
                        for line in result.stdout.split('\n'):
                            line = line.strip()
                            if line.startswith('Manufacturer='):
                                manufacturer = line.split('=', 1)[1].strip()
                            elif line.startswith('Model='):
                                model = line.split('=', 1)[1].strip()
                        
                        # Better validation of manufacturer and model
                        if (manufacturer and model and 
                            manufacturer not in generic_values and 
                            model not in generic_values and
                            len(manufacturer) > 2 and len(model) > 2):
                            return f"{manufacturer} {model}"
                except:
                    pass
                
                # Method 3: Try BIOS info as fallback
                try:
                    result = subprocess.run(['wmic', 'bios', 'get', 'manufacturer', '/value'], 
                                          capture_output=True, text=True, timeout=10)
                    if result.returncode == 0:
                        for line in result.stdout.split('\n'):
                            line = line.strip()
                            if line.startswith('Manufacturer='):
                                bios_manufacturer = line.split('=', 1)[1].strip()
                                if bios_manufacturer not in generic_values and len(bios_manufacturer) > 2:
                                    # Try to get system model for BIOS manufacturer
                                    try:
                                        result2 = subprocess.run(['wmic', 'computersystem', 'get', 'model', '/value'], 
                                                              capture_output=True, text=True, timeout=10)
                                        if result2.returncode == 0:
                                            for line2 in result2.stdout.split('\n'):
                                                line2 = line2.strip()
                                                if line2.startswith('Model='):
                                                    sys_model = line2.split('=', 1)[1].strip()
                                                    if sys_model not in generic_values and len(sys_model) > 2:
                                                        return f"{bios_manufacturer} System ({sys_model})"
                                    except:
                                        pass
                                    return f"{bios_manufacturer} System"
                except:
                    pass
                    
            elif system == 'linux':
                # Check if it's a Raspberry Pi first (most reliable)
                if os.path.exists('/proc/cpuinfo'):
                    try:
                        with open('/proc/cpuinfo', 'r') as f:
                            content = f.read()
                            if 'Raspberry Pi' in content:
                                # Extract Pi model
                                for line in content.split('\n'):
                                    if line.startswith('Model'):
                                        return line.split(':', 1)[1].strip()
                                return "Raspberry Pi"
                    except:
                        pass
                
                # Try DMI information with better validation
                dmi_info = {}
                dmi_files = {
                    'product_name': ['/sys/devices/virtual/dmi/id/product_name', '/sys/class/dmi/id/product_name'],
                    'board_name': ['/sys/devices/virtual/dmi/id/board_name', '/sys/class/dmi/id/board_name'],
                    'sys_vendor': ['/sys/devices/virtual/dmi/id/sys_vendor', '/sys/class/dmi/id/sys_vendor'],
                    'board_vendor': ['/sys/devices/virtual/dmi/id/board_vendor', '/sys/class/dmi/id/board_vendor']
                }
                
                # Read all available DMI info
                for key, paths in dmi_files.items():
                    for path in paths:
                        try:
                            if os.path.exists(path):
                                with open(path, 'r') as f:
                                    value = f.read().strip()
                                    if value and value not in generic_values and len(value) > 2:
                                        dmi_info[key] = value
                                        break
                        except:
                            continue
                
                # Try to build a meaningful device name from DMI info
                if 'product_name' in dmi_info:
                    product = dmi_info['product_name']
                    if 'sys_vendor' in dmi_info:
                        vendor = dmi_info['sys_vendor']
                        if vendor.lower() not in product.lower():
                            return f"{vendor} {product}"
                    return product
                
                # Fallback to board info
                if 'board_name' in dmi_info:
                    board = dmi_info['board_name']
                    if 'board_vendor' in dmi_info:
                        vendor = dmi_info['board_vendor']
                        if vendor.lower() not in board.lower():
                            return f"{vendor} {board}"
                    return board
                
                # Try lscpu for processor info as last resort
                try:
                    result = subprocess.run(['lscpu'], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        for line in result.stdout.split('\n'):
                            if 'Model name:' in line:
                                cpu_model = line.split(':', 1)[1].strip()
                                if cpu_model and len(cpu_model) > 10:
                                    return f"System ({cpu_model})"
                except:
                    pass
                        
            elif system == 'darwin':
                # Get Mac model
                try:
                    result = subprocess.run(['sysctl', '-n', 'hw.model'], capture_output=True, text=True)
                    if result.returncode == 0:
                        return result.stdout.strip()
                except:
                    pass
                    
        except Exception as e:
            logger.debug(f"Device model detection failed: {e}")
        
        # Fallback: Try to get a meaningful name from CPU info
        try:
            cpu_brand = platform.processor()
            if cpu_brand and len(cpu_brand) > 10:
                # Clean up common CPU strings to make them more readable
                if 'Intel' in cpu_brand:
                    return f"Intel System ({cpu_brand.split()[-1]})"
                elif 'AMD' in cpu_brand:
                    return f"AMD System ({cpu_brand.split()[-1]})"
                else:
                    return f"Custom System ({cpu_brand[:20]})"
        except:
            pass
        
        return None
    
    def detect_platform_info(self) -> Dict:
        """Detect comprehensive platform information"""
        system = platform.system()
        machine = platform.machine()
        
        # Get OS-specific information
        if system == 'Windows':
            os_version = self.get_windows_version()
            platform_type = 'windows'
        elif system == 'Linux':
            os_version = self.get_linux_distribution()
            platform_type = 'linux'
        elif system == 'Darwin':
            os_version = self.get_macos_version()
            platform_type = 'darwin'
        else:
            os_version = f"{system} {platform.release()}"
            platform_type = system.lower()
        
        # Get device model
        device_model = self.get_device_model()
        
        # Get hardware info using psutil
        try:
            cpu_cores = psutil.cpu_count(logical=False) or psutil.cpu_count() or 1
            cpu_threads = psutil.cpu_count() or cpu_cores
            
            # Memory in GB
            memory_bytes = psutil.virtual_memory().total
            memory_gb = round(memory_bytes / (1024**3), 1)
            
            # Storage in GB (main disk)
            storage_gb = 0
            try:
                # Get the main disk usage
                if system == 'Windows':
                    storage = shutil.disk_usage('C:\\')
                else:
                    storage = shutil.disk_usage('/')
                storage_gb = round(storage.total / (1024**3), 0)
            except:
                storage_gb = 100  # Fallback
                
        except Exception as e:
            logger.warning(f"Hardware detection failed: {e}")
            cpu_cores = 1
            cpu_threads = 1
            memory_gb = 4.0
            storage_gb = 100
        
        platform_info = {
            'os': os_version,
            'platform': platform_type,
            'architecture': machine,
            'device_model': device_model,
            'cpu_cores': cpu_cores,
            'cpu_threads': cpu_threads,
            'memory_gb': memory_gb,
            'storage_gb': storage_gb,
            'hostname': self.hostname
        }
        
        logger.info(f"🔍 Platform: {platform_type} | OS: {os_version}")
        logger.info(f"💻 Hardware: {cpu_cores}c/{cpu_threads}t, {memory_gb}GB RAM, {storage_gb}GB storage")
        if device_model:
            logger.info(f"🏭 Device: {device_model}")
        else:
            logger.info("🏭 Device: Generic System (no specific model detected)")
        
        return platform_info
    
    def create_broadcast_message(self) -> str:
        """Create UDP broadcast message with platform information"""
        message = {
            'type': 'smart_agent_broadcast',
            'hostname': self.hostname,
            'ip': self.local_ip,
            'ssh_port': 22,  # Default SSH port
            'capabilities': ['python3', self.platform_info['platform']],
            'device_type': 'smart_node',
            'timestamp': time.time(),
            
            # Rich system information
            'system_info': {
                'os': self.platform_info['os'],
                'platform': self.platform_info['platform'],
                'architecture': self.platform_info['architecture'],
                'hostname': self.hostname
            },
            
            # Device information
            'device_info': {
                'model': self.platform_info['device_model'],
                'os': self.platform_info['os']
            },
            
            # Hardware resources
            'resources': {
                'cpu_cores': self.platform_info['cpu_cores'],
                'cpu_threads': self.platform_info['cpu_threads'],
                'memory_gb': self.platform_info['memory_gb'],
                'storage_gb': self.platform_info['storage_gb']
            }
        }
        
        return json.dumps(message)
    
    def broadcast_loop(self):
        """Main broadcast loop - sends UDP discovery every 10 seconds"""
        device_name = self.platform_info.get('device_model') or self.hostname
        platform_name = self.platform_info['os']
        
        logger.info(f"Starting UDP broadcast for {device_name} ({self.local_ip})")
        logger.info(f"📊 Broadcasting: {self.platform_info['cpu_cores']}c/{self.platform_info['memory_gb']}GB/{self.platform_info['storage_gb']}GB")
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            
            while self.running:
                try:
                    message = self.create_broadcast_message()
                    sock.sendto(message.encode(), ('255.255.255.255', 8765))
                    logger.debug(f"📡 Broadcasted: {platform_name} -> {self.local_ip}")
                    
                except Exception as e:
                    logger.error(f"Broadcast error: {e}")
                
                time.sleep(10)  # Broadcast every 10 seconds
                
        except Exception as e:
            logger.error(f"Broadcast setup failed: {e}")
        finally:
            try:
                sock.close()
            except:
                pass
            logger.info("Broadcast stopped")
    
    def start(self):
        """Start the universal agent"""
        logger.info(f"🚀 Starting UniversalSMARTAgent on {self.platform_info['os']}")
        logger.info(f"💻 Hardware: {self.platform_info['cpu_cores']} cores, {self.platform_info['memory_gb']}GB RAM, {self.platform_info['storage_gb']}GB storage")
        if self.platform_info['device_model']:
            logger.info(f"🏭 Device: {self.platform_info['device_model']}")
        
        self.running = True
        
        # Start broadcast thread
        self.broadcast_thread = threading.Thread(target=self.broadcast_loop, daemon=True)
        self.broadcast_thread.start()
        
        logger.info("✅ Universal Agent started - broadcasting on UDP port 8765")
        logger.info("📡 Your device should now appear in SMART-Admin!")
        
        # Keep main thread alive
        try:
            while self.running:
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
            self.stop()
    
    def stop(self):
        """Stop the agent"""
        logger.info("Stopping UniversalSMARTAgent...")
        self.running = False
        
        # Wait for broadcast thread to finish
        if hasattr(self, 'broadcast_thread'):
            self.broadcast_thread.join(timeout=5)
        
        logger.info("Universal Agent stopped")

def main():
    """Main entry point"""
    # Check if required dependencies are available
    try:
        import psutil
    except ImportError:
        print("❌ Error: psutil is required. Install with: pip install psutil")
        return
    
    agent = UniversalSMARTAgent()
    
    try:
        agent.start()
    except Exception as e:
        logger.error(f"Agent error: {e}")
    finally:
        agent.stop()

if __name__ == '__main__':
    main()