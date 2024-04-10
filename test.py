from selenium import webdriver

PROXY="176.9.119.170:8080"
webdriver.DesiredCapabilities.CHROME['proxy'] = {
    "httpProxy": PROXY,
    "ftpProxy": PROXY,
    "sslProxy": PROXY,
    "proxyType": "MANUAL",

}

webdriver.DesiredCapabilities.CHROME['acceptSslCerts']=True

driver =webdriver.Chrome(r".\chromedriver.exe")


driver.get("https://www.google.com")