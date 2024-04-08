// console.error('hi');
const closeTime = 20; // in seconds

const template = (data) => {
	let template = document.createElement('template');
	template.innerHTML = data;
	return template.content;
};

const getStoredFlags = () => {
	return JSON.parse(localStorage.getItem('user-flags') || '{}');
};

const clean = (text) => {
	text = text.replace(/\n+/g, '\n');
	text = text.replace(/\s+/g, ' ');
	return text;
};

const generateTemplate = (data, flags, sender) => {
	let info = [];
	let details = [];

	if (flags.includes('user')) {
		info.push('username');
		details.push(`the username in question is "${clean(data.username)}"`);
	}
	if (flags.includes('display')) {
		info.push('display name');
		details.push(`the display name in question is "${clean(data.display)}"`);
	}
	if (flags.includes('bio')) {
		info.push('bio');
		details.push(`the bio in question is "${clean(data.bio)}"`);
	}

	if (flags.includes('avatar')) {
		info.push('avatar');
	}

	if (info.length > 1) {
		info[info.length - 1] = 'and ' + info[info.length - 1];
	}

	info = info.join(', ');

	details = details.join(', ');
	details = details.charAt(0).toUpperCase() + details.slice(1);
	details += '. ';

	let template = `I am writing to report an account with an inappropriate ${info} on your platform. ${details}The ${info} ${flags.length == 1 ? 'violates' : 'violate'} the community guidelines as ${
		flags.length == 1 ? 'it' : 'they'
	} ${flags.length == 1 ? 'contains' : 'contain'} offensive language/imagery not suitable for the platform.

I kindly request that the necessary actions be taken to address this issue promptly. This may include reaching out to the accountholder to change the inappropriate content to something more appropriate, or suspending the account entirely if deemed necessary.

Thank you for your attention to this matter. I believe by promptly addressing inappropriate content, we can contribute to a safer and respectful community.

${sender ? 'Sincerely,\n' + sender : ''}`;

	return template;
};

const user_id = window.location.href.match(/\d+/g)[0];
let flags = getStoredFlags();
if (Object.keys(flags).includes(user_id)) {
	flags = flags[user_id];
} else {
	flags = [];
}

let makeCookieTimeout = null;
let makeCookieInterval = null;

let main = template(`
<div id="pred-main">
    <div class="flags">
        <div class="flag button ${flags.includes('avatar') ? 'chosen' : ''}" data-name="avatar">Avatar</div>
        <div class="flag button ${flags.includes('display') ? 'chosen' : ''}" data-name="display">Display name</div>
        <div class="flag button ${flags.includes('user') ? 'chosen' : ''}" data-name="user">Username</div>
        <div class="flag button ${flags.includes('bio') ? 'chosen' : ''}" data-name="bio">Bio</div>
    </div>
    <div class="reports">
        <div class="button" id="dsa">
            DSA Report
        </div>
        <div class="button" id="standard">
            Standard Report
        </div>
    </div>
</div>
`);

document.querySelector('#profile-header-container').appendChild(main);

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
		if (!Object.keys(flags).includes(user_id)) {
			flags[user_id] = [];
		}

		if (flags[user_id].includes(name)) {
			flags[user_id] = flags[user_id].filter((e) => e != name);
		} else {
			flags[user_id] = flags[user_id].concat([name]);
		}
		console.log(flags);
		localStorage.setItem('user-flags', JSON.stringify(flags));
	});
});

const get_data = () => {
	return {
		id: user_id,
		display: document.querySelector('.profile-name:first-child').innerHTML,
		username: document.querySelector('.profile-display-name').innerHTML,
		bio: document.querySelector('#profile-about-text > span') ? document.querySelector('#profile-about-text > span').innerHTML : '',
	};
};

const report = (url) => {
	localStorage.setItem('reporting', JSON.stringify(get_data()));
	window.open(url, '_blank');
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

let dsaButton = document.querySelector('#pred-main > .reports > #dsa');
let standardButton = document.querySelector('#pred-main > .reports > #standard');
dsaButton.addEventListener('click', () => {
	dsaButton.classList.remove('error');
	dsaButton.innerHTML = 'Loading...';

	chrome.storage.local.get(['email', 'sender', 'country'], (result) => {
		if (
			!Object.keys(result).includes('email') ||
			!Object.keys(result).includes('sender') ||
			!Object.keys(result).includes('country') ||
			result.email.trim() == '' ||
			result.sender.trim() == '' ||
			result.country.trim() == ''
		) {
			showError('Please enter email/sender/country in popup', dsaButton, 'DSA Report');
		} else {
			let all_flags = JSON.parse(localStorage.getItem('user-flags'));
			if (!Object.keys(all_flags).includes(user_id)) {
				showError('Please choose one or more flag', dsaButton, 'DSA Report');
				return;
			}

			if (
				document.querySelector(
					'#right-navigation-header > div.navbar-right.rbx-navbar-right > ul > div.age-bracket-label.text-header > a > span.text-overflow.age-bracket-label-username.font-caption-header'
				) == null
			) {
				showError('Please log in', dsaButton, 'DSA Report', 5);
				return;
			}

			let flags = all_flags[user_id];
			let template = generateTemplate(get_data(), flags, result.sender.trim());

			// Check if server is running
			pingServer({ ping: true }).then((ping_result) => {
				if (!ping_result) {
					showError('Please turn on python flask server', dsaButton, 'DSA Report');
					return;
				}

				pingServer({
					ping: false,
					send_report: true,
					report_type: 'profile',
					id: user_id,
					template: template,
					sender: result.sender.trim(),
					email: result.email.trim(),
					country: result.country.trim(),
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

						showError(errors[json.type], dsaButton, 'DSA Report', 3);
					} else {
						dsaButton.innerHTML = 'DSA Report';
					}
				});
			});
		}
	});
});

standardButton.addEventListener('click', () => {
	standardButton.classList.remove('error');
	standardButton.innerHTML = 'Loading...';
	chrome.storage.local.get(['email', 'sender', 'country'], (result) => {
		if (result.email.trim() == '' || result.sender.trim() == '' || result.country.trim() == '') {
			showError('Please enter email/sender/country in popup', standardButton, 'Standard Report');
		} else {
			let all_flags = JSON.parse(localStorage.getItem('user-flags'));
			if (!Object.keys(all_flags).includes(user_id)) {
				showError('Please choose one or more flag', standardButton, 'Standard Report');
				return;
			}

			report(`https://www.roblox.com/abusereport/userprofile?id=${user_id}`);
			standardButton.innerHTML = 'Standard Report';
		}
	});
});
