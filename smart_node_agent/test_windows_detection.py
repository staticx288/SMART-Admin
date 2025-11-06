#!/usr/bin/env python3
"""
Test script for Windows detection - run this on Windows to debug version detection
"""

import platform
import subprocess
import sys

def test_windows_version():
    """Test Windows version detection methods"""
    print("=== Windows Version Detection Test ===")
    print(f"Platform system: {platform.system()}")
    print(f"Platform release: {platform.release()}")
    print(f"Platform version: {platform.version()}")
    
    if platform.system() == 'Windows':
        try:
            import winreg
            print("\n=== Registry Method ===")
            
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                               r"SOFTWARE\Microsoft\Windows NT\CurrentVersion")
            
            try:
                # Get all relevant values
                values_to_check = [
                    'ProductName', 'CurrentBuild', 'DisplayVersion', 
                    'ReleaseId', 'CurrentMajorVersionNumber', 'CurrentMinorVersionNumber'
                ]
                
                registry_data = {}
                for value_name in values_to_check:
                    try:
                        value = winreg.QueryValueEx(key, value_name)[0]
                        registry_data[value_name] = value
                        print(f"{value_name}: {value}")
                    except:
                        print(f"{value_name}: Not found")
                
                # Test build number detection
                build_number = registry_data.get('CurrentBuild', '0')
                build_int = int(build_number) if build_number.isdigit() else 0
                
                print(f"\nBuild number: {build_number} (int: {build_int})")
                
                if build_int >= 22000:
                    print("✅ Should detect as Windows 11")
                else:
                    print("✅ Should detect as Windows 10 or earlier")
                    
            finally:
                winreg.CloseKey(key)
                
        except Exception as e:
            print(f"Registry method failed: {e}")
    else:
        print("❌ Not running on Windows - cannot test Windows-specific methods")

def test_device_model():
    """Test device model detection methods"""
    print("\n=== Device Model Detection Test ===")
    
    if platform.system() == 'Windows':
        # Test WMIC commands
        wmic_commands = [
            ['wmic', 'baseboard', 'get', 'manufacturer,product', '/value'],
            ['wmic', 'computersystem', 'get', 'manufacturer,model', '/value'],
            ['wmic', 'bios', 'get', 'manufacturer', '/value']
        ]
        
        for cmd in wmic_commands:
            try:
                print(f"\nTesting: {' '.join(cmd)}")
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print("Output:")
                    for line in result.stdout.split('\n'):
                        line = line.strip()
                        if line and '=' in line:
                            print(f"  {line}")
                else:
                    print(f"Command failed with code: {result.returncode}")
                    print(f"Error: {result.stderr}")
            except Exception as e:
                print(f"Command failed: {e}")
    else:
        print("❌ Not running on Windows - cannot test WMIC commands")

if __name__ == '__main__':
    test_windows_version()
    test_device_model()
    
    print("\n=== Instructions ===")
    print("1. Copy this script to your Windows PC")
    print("2. Run: python test_windows_detection.py")
    print("3. Send the output to debug Windows detection issues")