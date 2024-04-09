from flask import Flask
from flask import request

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.service import Service

import json, time, re, subprocess, os, sys

active_drivers = 0

def get_driver_limit():
    with open('./limit.txt', 'r') as file:
        return int(file.read().strip())

# Get all processes using a specific port by using netstat
def get_port_pids(port):
    command = f'netstat -ano | findstr :{port} | findstr "LISTENING"'

    try:
        result = subprocess.check_output(command, shell=True)
    except subprocess.CalledProcessError:
        # This type of error is raised when there is no stdout, which means no there are no processes using this port
        return []

    pids = []

    lines = list(filter(lambda e: e, result.decode('utf8').split('\n')))
    for process in lines:
        pid = re.findall(r'\d+', process)[-1]
        pids.append(pid)

    return pids

# Kill all processes using a specific port by using taskkill
def clear_port(port):
    pids = get_port_pids(port)

    if len(pids) == 0: return True

    print(f'Found {len(pids)} PID(s) running on port {port}, stopping all of them...')

    for pid in pids:
        subprocess.run(f'taskkill /PID {pid} /F', shell=True)

    if len(get_port_pids(port)) == 0:
        print(f'Successfully stopped {len(pids)} PID(s), you can now use port {port} safely')
        return True
    else:
        print(f'Failed to stop {len(pids)} PID(s)')
        return False

def wait_for(driver, selector, delay=240):
    try:
        return WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
    except TimeoutException:
        return None

def kill(driver):
    global active_drivers
    if driver:
        driver.quit()
    active_drivers -= 1

def open_selenium(data):
    global active_drivers

    driver = None
    active_drivers += 1

    try:
        chrome_options = Options()

        with open('./proxy.txt', 'r') as file:
            content = file.read().strip()
            if content != '':
                print(content)
                chrome_options.add_argument(f'--proxy-server=http://{content}')
        chrome_options.add_experimental_option("detach", True)
        chrome_options.add_argument('--start-maximized')

        service = Service(executable_path='./chromedriver.exe')
        driver = webdriver.Chrome(service=service, options=chrome_options)

        driver.get('https://www.roblox.com/illegal-content-reporting')

        print('opened')

        clicks = []
        clicks.append(wait_for(driver, '#cookie-banner-wrapper > div.cookie-banner > div:nth-child(2) > div > div > button.btn-cta-lg.cookie-btn.btn-primary-md.btn-min-width'))
        clicks.append(wait_for(driver, '#issue-type-selection > div > div:nth-child(1) > label'))
        clicks.append(wait_for(driver, '#confirmCheckbox'))

        for element in clicks:
            tries = 0
            while True:
                if tries > 10:
                    print('Failed to click after 10 tries, quitting webdriver and opening new instance')
                    kill(driver)
                    time.sleep(1)
                    open_selenium(data)
                    return
                
                try:
                    element.click()
                    break
                except: 
                    tries += 1
                    pass
                time.sleep(1)


        url = ""
        match data["report_type"]:
            case 'profile':
                url = f'https://www.roblox.com/users/{data["id"]}/profile'
            case 'catalog':
                url = data["url"]
            case 'group':
                url = data["url"]

        wait_for(driver, '#url-input > input').send_keys(url)

        # Remove emojis from template
        template = data["template"]
        template = re.sub(r'[^\x00-\x7F]+',' ', template)

        wait_for(driver, "#illegal-description-input > textarea").send_keys(template)

        countries = driver.find_elements(By.CSS_SELECTOR, '.rbx-select > option')

        option = list(filter(lambda element: data["country"] in element.text, countries))[0]
        option.click()

        wait_for(driver, '#reporter-info-name > input').send_keys(data["sender"])
        wait_for(driver, '#reporter-info-email > input').send_keys(data["email"])


        element = wait_for(driver, '#dsa-illegal-content-report-container > div > div.modal-overlay > div > div > div.modal-head-left > h2', delay=240)

        if element:
            driver.execute_script("arguments[0].innerHTML = 'Closing webdriver in a few seconds...'; arguments[0].style = 'color: red;'", element)
            time.sleep(2)

        kill(driver)

        return { "error": False }
    except Exception as e:
        print(str(e))
        kill(driver)
        print('Killed driver because an error occured')

        if 'ERR_PROXY_CONNECTION_FAILED' in str(e):
            return { "error": True, "type": "bad-proxy"}

        if 'This version of ChromeDriver only supports' in str(e):
            return { "error": True, "type": "outdated-driver"}
        
        if 'target window already closed' in str(e):
            return { "error": True, "type": "closed"}
        
        if 'need to be in PATH' in str(e):
            return { "error": True, "type": "closed"}

        if ':ERR_TUNNEL_CONNECTION_FAILED' in str(e):
            return { "error": True, "type": "network"}

        return { "error": True, "type": "unknown"}
    
app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def main():
    if request.method == "GET":
        return "<p>Hello, World!</p>"
    
    if request.method == 'POST':
        data = json.loads(request.data.decode('utf8'))
        if "send_report" in data:
            driver_limit = get_driver_limit()
            if active_drivers >= driver_limit:                
                return { "error": True, "type": "driver-limit", "limit": driver_limit}

            return open_selenium(data)
        return { "error": True, "type": "unknown" }

with open('port.txt', 'r') as file:
    port = int(file.read().strip()) or 8080

    # Clear all process using this port
    result = clear_port(port)

    # Run app if success
    if result:
        print('Port is safe to use')
        app.run(host="0.0.0.0", port=port, threaded=True)
    else:
        # Otherwise, change the port
        if port == 8100:
            port = 8000
        else:
            port += 1

        print(f'Changing port to {port}...')

        with open('port.txt', 'w') as file:
            file.write(str(port))

        # Restart the server
        print(f'Restarting server...')
        os.execv(sys.executable, ['python'] + sys.argv)
        