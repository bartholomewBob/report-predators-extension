from flask import Flask
from flask import request

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

import json, time, re

def wait_for(driver, selector, delay=20):
    try:
        return WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
    except TimeoutException:
        return None

active = False

def open_selenium(data):
    global active

    if active:
        print('Failed to open driver, one is currently open')
        return { "error": True, "type": "driver-open"}

    active = True
    driver = None

    try:
        chrome_options = Options()

        with open('./proxy.txt', 'r') as file:
            content = file.read().strip()
            if content != '':
                print(content)
                chrome_options.add_argument(f'--proxy-server=http://{content}')
        chrome_options.add_experimental_option("detach", True)
        chrome_options.add_argument('--start-maximized')

        driver = webdriver.Chrome(executable_path="./chromedriver.exe", options=chrome_options)
        driver.get('https://www.roblox.com/illegal-content-reporting')

        wait_for(driver, '#cookie-banner-wrapper > div.cookie-banner > div:nth-child(2) > div > div > button.btn-cta-lg.cookie-btn.btn-primary-md.btn-min-width').click()
        
        wait_for(driver, '#issue-type-selection > div > div:nth-child(1) > label').click()

        wait_for(driver, '#url-input > input').send_keys(f'https://www.roblox.com/users/{data["id"]}/profile')

        template = data["template"]
        template = re.sub(r'[^\x00-\x7F]+',' ', template)
        wait_for(driver, "#illegal-description-input > textarea").send_keys(template)

        countries = driver.find_elements(By.CSS_SELECTOR, '.rbx-select > option')

        option = list(filter(lambda element: data["country"] in element.text, countries))[0]
        option.click()

        wait_for(driver, '#reporter-info-name > input').send_keys(data["sender"])
        wait_for(driver, '#reporter-info-email > input').send_keys(data["email"])

        wait_for(driver, '#confirmCheckbox').click()

        element = wait_for(driver, '#dsa-illegal-content-report-container > div > div.modal-overlay > div > div > div.modal-head-left > h2', delay=240)

        if element:
            driver.execute_script("arguments[0].innerHTML = 'Closing webdriver in a few seconds...'; arguments[0].style = 'color: red;'", element)
            time.sleep(2)
            driver.quit()
        else:
            driver.quit()

        active = False
        return { "error": False }
    except Exception as e:
        print(str(e))
        active = False
        
        if 'This version of ChromeDriver only supports' in str(e):
            if driver: driver.quit()
            return { "error": True, "type": "outdated-driver"}
        
        if 'target window already closed' in str(e):
            if driver: driver.quit()
            return { "error": True, "type": "closed"}
        
        if 'need to be in PATH' in str(e):
            if driver: driver.quit()
            return { "error": True, "type": "closed"}

        if ':ERR_TUNNEL_CONNECTION_FAILED' in str(e):
            if driver: driver.quit()
            return { "error": True, "type": "network"}

        if driver: driver.quit()
        return { "error": True, "type": "unknown"}
    
app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def main():
    print(request)
    if request.method == "GET":
        return "<p>Hello, World!</p>"
    
    if request.method == 'POST':
        data = json.loads(request.data.decode('utf8'))
        if "send_report" in data:
            return open_selenium(data)
        return { "error": True, "type": "unknown" }

with open('port.txt', 'r') as file:
    port = int(file.read().strip()) or 8080
    app.run(host="0.0.0.0", port=port, threaded=True)