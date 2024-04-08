# Report Predators Chrome Extension

Use this chrome extension to report roblox profiles, autofill DSA and Standard report forms, and auto-generate a report template.

## Demo

![](https://github.com/bartholomewBob/report-predators-extension/blob/main/showcase.gif)

## Installing Python & PIP (if not installed)

1. Install python from the official website https://www.python.org/downloads/
2. Download get-pip.py from an official source, here's one: https://bootstrap.pypa.io/get-pip.py
3. Open a command prompt and navigate to where the get-pip.py file is
4. Run the get-pip.py file

```bash
python get-pip.py
```

or

```bash
python3 get-pip.py
```

5. Check if pip is installed

```bash
pip --version
```

or

```bash
pip3 --version
```

## Installing essentials

-   **VPN/Proxy (for DSA reports only)**

If you have a desktop or system-wide VPN that has available european countries, use it, otherwise you can use a proxy

You can use a paid/premium proxy but there are free proxy lists available online that work too e.g: https://www.freeproxy.world/

If you want to use a proxy, use the format `<ip_address>:<port>`, and copy it into `proxy.txt`

-   **Installing/Updating Chromedriver (for DSA reports only)**

1. Delete chromedriver.exe from your extension directory if you are updating the chromedriver
2. Go to https://googlechromelabs.github.io/chrome-for-testing/#stable
3. From the table, pick the "chromedriver" binary on the "win64" platform or "win32" platform
4. Copy the URL and paste it into a new tab, this should download it
5. Drag the ZIP file into your extension directory
6. Run "Extract here"
7. Remove LICENSE.chromedriver

-   **Installing python packages (Python & PIP required)**

1. Open a command prompt and navigate to your extension directory
2. Run this command to install all packages

```bash
pip install -r requirements.txt
```

or

```bash
pip3 install -r requirements.txt
```

## Installing extension

1. Go to chrome://extensions/
2. Enable developer mode in the top-right corner
3. Click "Load unpacked" in the top-left corner
4. Select your extension folder

## Extension Setup

1. If you are going to be using DSA reports, run `python server.py`, and keep it running during your entire reporting session
2. Fill out all necessary DSA form information from the extension popup, you can go there by clicking on the puzzle piece icon (extensions icon) on the top-right next to your chrome profile
3. Scroll down and look for "Roblox Reporter" and click it, a popup should open
4. Fill out the email, sender and a country

## Common Errors & Fixes

**Outdated chrome/chromedriver** or **Can't find driver**

-   Update your chrome from chrome://settings/help
-   Update your chromedriver by following the steps in ["Installing/Updating Chromedriver"](installing-essentials)
    **Connection failed**
-   If you're using a VPN, try clearing `proxy.txt`, otherwise change the VPN and check if the country is in Europe. If you're using a proxy, try changing the proxy in `proxy.txt`
    **DSA Report takes forever to load**
-   Change the port in `port.txt` to another number, e.g: 8000, 5000, etc.
