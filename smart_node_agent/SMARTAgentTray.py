#!/usr/bin/env python3
"""
SMART Node Agent - System Tray Application
Runs in background with system tray icon for easy control
Cross-platform support: Windows, Linux (with systray), macOS
"""

import sys
import os
import logging
from pathlib import Path

# Try to import system tray library
try:
    import pystray
    from pystray import MenuItem as item
    from PIL import Image, ImageDraw
    TRAY_AVAILABLE = True
except ImportError:
    TRAY_AVAILABLE = False
    print("⚠️  System tray support not available. Install with: pip install pystray pillow")
    print("    Running in console mode instead...")

# Import the main agent
from UniversalSMARTAgent import UniversalSMARTAgent, logger

class SMARTAgentTray:
    """System tray application wrapper for SMART Node Agent"""
    
    def __init__(self):
        self.agent = None
        self.icon = None
        self.running = False
        
        # Setup logging to file for background operation
        log_dir = Path(__file__).parent / 'logs'
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / 'smart_agent.log'
        
        # Add file handler to logger
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
        logger.addHandler(file_handler)
        
        logger.info("=" * 60)
        logger.info("SMART Node Agent - System Tray Mode Starting")
        logger.info("=" * 60)
    
    def create_icon_image(self):
        """Create a simple icon for the system tray"""
        # Create a 64x64 icon with SMART branding
        width = 64
        height = 64
        color1 = (0, 123, 255)  # Blue
        color2 = (255, 255, 255)  # White
        
        image = Image.new('RGB', (width, height), color1)
        dc = ImageDraw.Draw(image)
        
        # Draw "S" for SMART
        dc.text((width // 4, height // 4), "S", fill=color2)
        
        return image
    
    def start_agent(self):
        """Start the SMART Node Agent"""
        if not self.running:
            try:
                self.agent = UniversalSMARTAgent()
                self.running = True
                
                # Start agent in a separate thread (it's already threaded internally)
                import threading
                agent_thread = threading.Thread(target=self.agent.start, daemon=True)
                agent_thread.start()
                
                logger.info("✅ SMART Node Agent started successfully")
                
                if TRAY_AVAILABLE and self.icon:
                    try:
                        self.icon.notify("SMART Node Agent started", "Now broadcasting to SMART-Admin")
                    except NotImplementedError:
                        # Notifications not supported on this platform (e.g., Linux X11)
                        logger.debug("Desktop notifications not supported on this platform")
                    
            except Exception as e:
                logger.error(f"❌ Failed to start agent: {e}")
                if TRAY_AVAILABLE and self.icon:
                    try:
                        self.icon.notify("SMART Agent Error", str(e))
                    except NotImplementedError:
                        pass  # Notifications not supported
    
    def stop_agent(self):
        """Stop the SMART Node Agent"""
        if self.running and self.agent:
            try:
                self.agent.stop()
                self.running = False
                logger.info("🛑 SMART Node Agent stopped")
                
                if TRAY_AVAILABLE and self.icon:
                    try:
                        self.icon.notify("SMART Node Agent stopped", "Agent is no longer broadcasting")
                    except NotImplementedError:
                        pass  # Notifications not supported
                    
            except Exception as e:
                logger.error(f"❌ Failed to stop agent: {e}")
    
    def get_agent_status(self):
        """Get current agent status for menu"""
        if self.running and self.agent:
            interfaces = len(self.agent.network_interfaces)
            return f"Running ({interfaces} interface{'s' if interfaces != 1 else ''})"
        return "Stopped"
    
    def show_info(self, icon=None, item=None):
        """Show agent information"""
        if self.agent:
            info = f"""SMART Node Agent
            
Status: {self.get_agent_status()}
Hostname: {self.agent.hostname}
Platform: {self.agent.platform_info['os']}
Device: {self.agent.platform_info.get('device_model') or 'Generic System'}

Hardware:
- CPU: {self.agent.platform_info['cpu_cores']} cores / {self.agent.platform_info['cpu_threads']} threads
- RAM: {self.agent.platform_info['memory_gb']} GB
- Storage: {self.agent.platform_info['storage_gb']} GB

Network Interfaces:
"""
            for iface in self.agent.network_interfaces:
                info += f"- {iface['interface']}: {iface['ip']}\n"
            
            logger.info(f"Agent Info Requested:\n{info}")
            
            if TRAY_AVAILABLE and icon:
                try:
                    icon.notify("SMART Node Agent Info", f"Status: {self.get_agent_status()}\nCheck log for details")
                except NotImplementedError:
                    pass  # Notifications not supported
        else:
            info = "Agent not initialized"
            logger.info(info)
            if TRAY_AVAILABLE and icon:
                try:
                    icon.notify("SMART Node Agent", info)
                except NotImplementedError:
                    pass  # Notifications not supported
    
    def open_log_file(self, icon=None, item=None):
        """Open the log file in default text editor"""
        log_file = Path(__file__).parent / 'logs' / 'smart_agent.log'
        
        try:
            import subprocess
            import platform
            
            system = platform.system()
            if system == 'Windows':
                os.startfile(log_file)
            elif system == 'Darwin':  # macOS
                subprocess.run(['open', log_file])
            else:  # Linux
                subprocess.run(['xdg-open', log_file])
                
            logger.info(f"Opened log file: {log_file}")
        except Exception as e:
            logger.error(f"Failed to open log file: {e}")
    
    def toggle_agent(self, icon=None, item=None):
        """Toggle agent on/off"""
        if self.running:
            self.stop_agent()
        else:
            self.start_agent()
    
    def quit_app(self, icon=None, item=None):
        """Quit the application"""
        logger.info("🛑 Shutting down SMART Node Agent...")
        self.stop_agent()
        
        if TRAY_AVAILABLE and icon:
            icon.stop()
        
        sys.exit(0)
    
    def run_tray(self):
        """Run the system tray application"""
        if not TRAY_AVAILABLE:
            print("❌ System tray not available. Running in console mode...")
            print("   Install system tray support with: pip install pystray pillow")
            print()
            self.run_console()
            return
        
        # Create system tray icon
        image = self.create_icon_image()
        
        def show_status(icon, item):
            try:
                icon.notify("Status", self.get_agent_status())
            except NotImplementedError:
                logger.info(f"Status: {self.get_agent_status()}")
        
        menu = pystray.Menu(
            item('SMART Node Agent', self.show_info, default=True),
            item('Status', show_status),
            pystray.Menu.SEPARATOR,
            item(
                lambda text: f"{'Stop' if self.running else 'Start'} Agent",
                self.toggle_agent
            ),
            pystray.Menu.SEPARATOR,
            item('Show Info', self.show_info),
            item('Open Log', self.open_log_file),
            pystray.Menu.SEPARATOR,
            item('Quit', self.quit_app)
        )
        
        self.icon = pystray.Icon("smart_agent", image, "SMART Node Agent", menu)
        
        # Start agent automatically
        self.start_agent()
        
        # Run the system tray icon
        logger.info("🎯 System tray icon active")
        self.icon.run()
    
    def run_console(self):
        """Fallback console mode if system tray not available"""
        print("╔════════════════════════════════════════════════════════════╗")
        print("║         SMART Node Agent - Console Mode                   ║")
        print("╚════════════════════════════════════════════════════════════╝")
        print()
        print("Commands:")
        print("  start  - Start the agent")
        print("  stop   - Stop the agent")
        print("  status - Show agent status")
        print("  info   - Show detailed information")
        print("  quit   - Exit the application")
        print()
        
        while True:
            try:
                cmd = input("SMART> ").strip().lower()
                
                if cmd == 'start':
                    if not self.running:
                        self.start_agent()
                        print("✅ Agent started")
                    else:
                        print("⚠️  Agent already running")
                        
                elif cmd == 'stop':
                    if self.running:
                        self.stop_agent()
                        print("🛑 Agent stopped")
                    else:
                        print("⚠️  Agent not running")
                        
                elif cmd == 'status':
                    print(f"Status: {self.get_agent_status()}")
                    
                elif cmd == 'info':
                    self.show_info()
                    
                elif cmd in ('quit', 'exit', 'q'):
                    print("Shutting down...")
                    self.quit_app()
                    break
                    
                else:
                    print("Unknown command. Type 'help' for available commands.")
                    
            except KeyboardInterrupt:
                print("\nShutting down...")
                self.quit_app()
                break
            except Exception as e:
                print(f"Error: {e}")

def main():
    """Main entry point"""
    # Check if running with --console flag
    console_mode = '--console' in sys.argv or '-c' in sys.argv
    
    app = SMARTAgentTray()
    
    if console_mode or not TRAY_AVAILABLE:
        app.run_console()
    else:
        app.run_tray()

if __name__ == '__main__':
    main()
