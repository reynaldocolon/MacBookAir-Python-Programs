import openpyxl
import warnings
import time
import re
import calendar
import os
import tkinter as tk
from tkinter import filedialog
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Suppress Excel formatting warnings to keep the terminal clean
warnings.filterwarnings("ignore", category=UserWarning)

def select_file():
    """Opens a Windows file dialog to let the user pick the Excel report."""
    root = tk.Tk()
    root.withdraw()  # Hide the main Tkinter window
    root.attributes("-topmost", True)  # Bring the dialog to the front
    file_path = filedialog.askopenfilename(
        title="Select WIC Expenditure Report",
        filetypes=[("Excel files", "*.xlsx")]
    )
    root.destroy()
    return file_path

def get_report_data(file_path):
    """Extracts accounting numbers, dates, and financial totals from the Excel file."""
    # data_only=True reads the calculated values of formulas instead of the formulas themselves
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb["Main"] if "Main" in wb.sheetnames else wb.active
    
    # --- 1. EXTRACT G-NUMBER ---
    # Looks for a pattern like 'G-12345' inside cell A5 using Regular Expressions
    raw_a5 = str(sheet["A5"].value or "")
    g_match = re.search(r'G[A-Z0-9-]+', raw_a5, re.IGNORECASE)
    g_number = g_match.group(0) if g_match else "G-Number Missing"
    
    # --- 2. DETECT REPORTING PERIOD ---
    # Detects the month and year based on the filename (e.g., "WIC_JAN_2026.xlsx")
    filename = os.path.basename(file_path).upper()
    
    month_map = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08', 
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    }
    
    month_num = "01" 
    for month_key, m_num in month_map.items():
        if month_key in filename:
            month_num = m_num
            break

    year_match = re.search(r'20\d{2}', filename)
    year = year_match.group(0) if year_match else "2026"
    
    # Calculate the last day of the detected month (handles leap years)
    last_day = calendar.monthrange(int(year), int(month_num))[1]
    
    periods = {
        "from": f"{month_num}/01/{year}",
        "through": f"{month_num}/{last_day}/{year}"
    }
    
    # --- 3. EXTRACT FINANCIAL DATA ---
    # Target columns (F, D, C, E, H) and rows (16, 37)
    # Rounds values to the nearest whole integer
    cols, rows = [6, 4, 3, 5, 8], [16, 37]
    data = [int(float(sheet.cell(r, c).value or 0) + 0.5) for r in rows for c in cols]
            
    return g_number, data, sum(data), periods

def run_automation(g_number, data, total, periods):
    """Handles the browser interaction and data injection."""
    options = Options()
    options.add_experimental_option("detach", True)  # Keeps browser open after script finishes
    driver = webdriver.Chrome(options=options)
    
    # Display summary in terminal for user verification
    print("\n" + "="*50)
    print(f"📄 DATA READY FOR INJECTION:")
    print(f"   Account: {g_number}")
    print(f"   Dates:   {periods['from']} - {periods['through']}")
    print(f"   Total:   ${total:,}")
    print("="*50)
    
    driver.get("https://dohsage.intelligrants.com/IGXLogin")
    # Pause to let human handle login and MFA
    input("\n👉 Log in, open the specific report, THEN press ENTER here...")

    # Identify all iFrames (Intelligrants uses nested frames)
    iframes = driver.find_elements(By.TAG_NAME, "iframe")

    # --- STEP 1: INJECT DATES & ACCOUNT NUMBER ---
    # Loops through all frames to find the Date and Account fields
    for frame_index in range(-1, len(iframes)):
        if frame_index == -1: driver.switch_to.default_content()
        else: driver.switch_to.frame(frame_index)
        
        # XPaths to identify the "From", "To", and "Account" input boxes
        targets = [
            (f"//input[contains(@aria-label, 'From') or contains(@id, 'From')]", periods['from']),
            (f"//input[contains(@aria-label, 'Through') or contains(@aria-label, 'To') or contains(@id, 'To')]", periods['through']),
            (f"//input[contains(@aria-label, 'Account') or contains(@value, 'G-')]", g_number)
        ]
        
        for xpath, val in targets:
            try:
                el = driver.find_element(By.XPATH, xpath)
                
                # Use JavaScript to force the fields to be editable (bypasses 'readonly' attributes)
                driver.execute_script("""
                    arguments[0].removeAttribute('readonly');
                    arguments[0].removeAttribute('disabled');
                    arguments[0].scrollIntoView(true);
                """, el)
                
                el.click()
                time.sleep(0.1)
                el.clear()
                el.send_keys(val)
                
                # Trigger internal website events so the site "registers" the new typed data
                driver.execute_script("""
                    arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                    arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                    arguments[0].dispatchEvent(new Event('blur', { bubbles: true }));
                """, el)
                print(f"⚡ Injected: {val}")
                time.sleep(0.3) 
            except: continue # If field isn't in this frame, move to next

    # --- STEP 2: INJECT FUNDING BOXES ---
    # Locate the rows of dollar amount boxes
    search_query = "//input[contains(@aria-label, 'monPrdGrant') or contains(@data-igx-alias, 'monPrdGrant')]"
    
    found_fields = []
    for frame_index in range(-1, len(iframes)):
        if frame_index == -1: driver.switch_to.default_content()
        else: driver.switch_to.frame(frame_index)
        found_fields = driver.find_elements(By.XPATH, search_query)
        if found_fields: break

    # Paste the extracted Excel values into the web form boxes
    if found_fields:
        for i, value in enumerate(data):
            if i < len(found_fields):
                driver.execute_script("""
                    arguments[0].removeAttribute('disabled');
                    arguments[0].removeAttribute('readonly');
                    arguments[0].value = arguments[1];
                    arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                    arguments[0].dispatchEvent(new Event('blur', { bubbles: true }));
                """, found_fields[i], str(value))
                print(f"✅ Box {i+1}: {value}")

    print(f"\n✨ Completed: {g_number}")

# --- MAIN EXECUTION LOOP ---
if __name__ == "__main__":
    while True:
        try:
            path = select_file()
            if not path: break  # User cancelled the file selection
            
            # 1. Get data from Excel
            g_num, values, grand_total, dates = get_report_data(path)
            
            # 2. Start browser and inject data
            run_automation(g_num, values, grand_total, dates)
            
            # 3. Prompt for the next file
            cont = input("\n🔄 Process next report? (y/n): ").lower()
            if cont != 'y': break
        except Exception as e:
            print(f"⚠️ Error: {e}")
            break