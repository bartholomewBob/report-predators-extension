// console.error('hi');

function waitForElement(selector, callback, checkFrequencyInMs, timeoutInMs) {
	var startTimeInMs = Date.now();
	(function loopSearch() {
		if (document.querySelector(selector) != null) {
			callback();
			return;
		} else {
			setTimeout(function () {
				if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) return;
				loopSearch();
			}, checkFrequencyInMs);
		}
	})();
}

const template = (data) => {
	let template = document.createElement('template');
	template.innerHTML = data;
	return template.content;
};

const generateTemplate = (sender) => {
	let template = `I am writing to report an inappropriate catalog item on your platform. This item violates the community guidelines as it contains offensive language/imagery not suitable for the platform.

I kindly request that the necessary actions be taken to address this issue promptly. This may include reaching out to the creator of the item to change the inappropriate content to something more appropriate, or removing the item entirely if deemed necessary.

Thank you for your attention to this matter. I believe by promptly addressing inappropriate content, we can contribute to a safer and respectful community.

${sender ? 'Sincerely,\n' + sender : ''}`;

	return template;
};

// Wait for "By <user>" element to appear indicating an item
waitForElement(
	'#item-info-container-frontend > div > div.item-details-info-header.border-bottom.item-name-container > div.left > div.item-details-creator-container > span.text-label',
	() => {
		let main = template(`
<div id="pred-main" style="margin-bottom: 0px; margin-top: 18px;">
	<div class="button" id="dsa-report">DSA Report</div>
</div>
`);

		document.querySelector('#item-container > div.remove-panel.section-content.top-section').appendChild(main);

		let button = document.querySelector('#dsa-report');

		const showError = (error, button, text, delay = 1) => {
			button.innerHTML = error;
			button.classList.add('error');
			setTimeout(function () {
				button.innerHTML = text;
				button.classList.remove('error');
			}, delay * 1000);
		};

		const pingServer = (data) => {
			return new Promise((resolve, reject) => {
				chrome.runtime.sendMessage(data, function (response) {
					resolve(response);
				});
			});
		};

		button.addEventListener('click', () => {
			button.classList.remove('error');
			button.innerHTML = 'Loading...';

			chrome.storage.local.get(['email', 'sender', 'country'], (result) => {
				if (
					!Object.keys(result).includes('email') ||
					!Object.keys(result).includes('sender') ||
					!Object.keys(result).includes('country') ||
					result.email.trim() == '' ||
					result.sender.trim() == '' ||
					result.country.trim() == ''
				) {
					showError('Please enter email/sender/country in popup', button, 'DSA Report');
				} else {
					// Check if server is running
					pingServer({ ping: true }).then((ping_result) => {
						if (!ping_result) {
							showError('Please turn on python flask server', button, 'DSA Report');
							return;
						}

						pingServer({
							ping: false,
							send_report: true,
							report_type: 'catalog',
							url: window.location.href,
							sender: result.sender.trim(),
							email: result.email.trim(),
							country: result.country.trim(),
							template: generateTemplate(result.sender.trim()),
						}).then((result) => {
							let json = JSON.parse(result);
							console.log(json);
							if (json.error) {
								let errors = {
									'outdated-driver': 'Outdated chrome/chromedriver, please update chrome and your chromedriver',
									'closed': 'Webdriver was closed',
									'no-driver': "Can't find driver, please install from the official site",
									'network': 'Connection failed. Try changing VPN/Proxy',
									'driver-open': 'Failed to open driver, a current one is open',
									'unknown': 'An unknown error has occured',
								};

								showError(errors[json.type], button, 'DSA Report', 3);
							} else {
								button.innerHTML = 'DSA Report';
							}
						});
					});
				}
			});
		});
	},
	1000,
	9000
);
