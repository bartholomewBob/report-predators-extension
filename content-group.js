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

const clean = (text) => {
	text = text.replace(/\n+/g, '\n');
	text = text.replace(/\s+/g, ' ');
	return text;
};

const template = (data) => {
	let template = document.createElement('template');
	template.innerHTML = data;
	return template.content;
};

const generateTemplate = (data, flags, sender) => {
	let info = [];
	let details = [];

	if (flags.includes('name')) {
		info.push('name');
		details.push(`the name in question is "${clean(data.name)}"`);
	}
	if (flags.includes('image')) {
		info.push('image');
	}

	if (info.length > 1) {
		info[info.length - 1] = 'and ' + info[info.length - 1];
	}

	info = info.join(', ');

	details = details.join(', ');
	details = details.charAt(0).toUpperCase() + details.slice(1);
	details += '. ';

	let template = `I am writing to report a group with an inappropriate ${info} on your platform. ${details}The ${info} ${flags.length == 1 ? 'violates' : 'violate'} the community guidelines as ${
		flags.length == 1 ? 'it' : 'they'
	} ${flags.length == 1 ? 'contains' : 'contain'} offensive language/imagery not suitable for the platform.

I kindly request that the necessary actions be taken to address this issue promptly. This may include reaching out to the accountholder to change the inappropriate content to something more appropriate, or suspending the account entirely if deemed necessary.

Thank you for your attention to this matter. I believe by promptly addressing inappropriate content, we can contribute to a safer and respectful community.

${sender ? 'Sincerely,\n' + sender : ''}`;

	return template;
};

const getStoredFlags = () => {
	return JSON.parse(localStorage.getItem('group-flags') || '{}');
};

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

const group_id = window.location.href.match(/\d+/g)[0];

let flags = getStoredFlags();
if (Object.keys(flags).includes(group_id)) {
	flags = flags[group_id];
} else {
	flags = [];
}

// Wait for "By <user>" element to appear indicating an item
waitForElement(
	'#group-container > div > div > div.group-details.col-xs-12.ng-scope.col-sm-9 > div > div.section-content > div.group-header > div.group-caption.ng-scope > div:nth-child(2) > div',
	() => {
		let main = template(`
<div id="pred-main" style="margin-bottom: 18px; margin-top: 18px; background-color: #232527;">
	<div class="flags">
		<div class="flag button ${flags.includes('name') ? 'chosen' : ''}" data-name="name">Name</div>
		<div class="flag button ${flags.includes('image') ? 'chosen' : ''}" data-name="image">Image</div>
	</div>
	<div class="button" id="dsa-report">DSA Report</div>
</div>
`);

		parent = document.querySelector('#group-container > div > div > div.group-details.col-xs-12.ng-scope.col-sm-9 > div > div.rbx-tabs-horizontal');
		parent.insertBefore(main, parent.firstChild);

		let flag_elements = Array.from(document.querySelectorAll('#pred-main > .flags > .flag'));

		flag_elements.map((flag) => {
			flag.addEventListener('click', () => {
				// Set class
				let classes = Array.from(flag.classList);

				if (!classes.includes('chosen')) {
					flag.classList.add('chosen');
				} else {
					flag.classList.remove('chosen');
				}

				// Set local storage
				let name = flag.getAttribute('data-name');
				let flags = getStoredFlags();

				// Add to storage if not exist
				if (!Object.keys(flags).includes(group_id)) {
					flags[group_id] = [];
				}

				if (flags[group_id].includes(name)) {
					flags[group_id] = flags[group_id].filter((e) => e != name);
				} else {
					flags[group_id] = flags[group_id].concat([name]);
				}
				console.log(flags);
				localStorage.setItem('group-flags', JSON.stringify(flags));
			});
		});

		let button = document.querySelector('#dsa-report');

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
					return showError('Please enter email/sender/country in popup', button, 'DSA Report');
				}

				let all_flags = JSON.parse(localStorage.getItem('group-flags'));
				if (!Object.keys(all_flags).includes(group_id)) {
					showError('Please choose one or more flag', button, 'DSA Report');
					return;
				}

				// Check if server is running
				pingServer({ ping: true }).then((ping_result) => {
					if (!ping_result) {
						showError('Please turn on python flask server', button, 'DSA Report');
						return;
					}

					let groupName = document.querySelector('.group-title:nth-child(2) .group-name').innerHTML;

					let template = generateTemplate({ name: groupName }, all_flags[group_id], result.sender.trim());

					pingServer({
						ping: false,
						send_report: true,
						report_type: 'catalog',
						url: `https://www.roblox.com/groups/${group_id}`,
						sender: result.sender.trim(),
						email: result.email.trim(),
						country: result.country.trim(),
						template: template,
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
			});
		});
	},
	1000,
	9000
);
