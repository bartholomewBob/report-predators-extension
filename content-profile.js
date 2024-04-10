const checkLastReport = () => {
	let previous = document.querySelector('#pred-main > #timestamp');
	if (previous) {
		previous.remove();
	}

	let reports = JSON.parse(localStorage.getItem('reports') || '[]');
	let user = reports.find((report) => report.user == user_id);
	if (!user) return;

	let timestamp = formatUnix(user.timestamp);

	let parent = document.querySelector('#pred-main');

	let main = template(`
<div id="timestamp">
	Last report: ${timestamp} - Total reports: ${user.reports}
</div>
`);
	parent.insertBefore(main, parent.firstChild);
};

const user_id = window.location.href.match(/\d+/g)[0];

const getMainTemplate = () => {
	let flags = getStoredFlags('user-flags');
	if (Object.keys(flags).includes(user_id)) {
		flags = flags[user_id];
	} else {
		flags = [];
	}

	return template(`
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
};

document.querySelector('#profile-header-container').appendChild(getMainTemplate());

checkLastReport();

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
		let flags = getStoredFlags('user-flags');

		// Add to storage if not exist
		if (!Object.keys(flags).includes(user_id)) {
			flags[user_id] = [];
		}

		if (flags[user_id].includes(name)) {
			flags[user_id] = flags[user_id].filter((e) => e != name);
		} else {
			flags[user_id] = flags[user_id].concat([name]);
		}

		localStorage.setItem('user-flags', JSON.stringify(flags));
	});
});

const getData = () => {
	return {
		id: user_id,
		display: document.querySelector('.profile-name:first-child').innerHTML,
		username: document.querySelector('.profile-display-name').innerHTML,
		bio: document.querySelector('#profile-about-text > span') ? document.querySelector('#profile-about-text > span').innerHTML : '',
	};
};

const report = (url) => {
	localStorage.setItem('reporting', JSON.stringify(getData()));
	window.open(url, '_blank');
};

let dsaButton = document.querySelector('#pred-main > .reports > #dsa');
let standardButton = document.querySelector('#pred-main > .reports > #standard');
dsaButton.addEventListener('click', async () => {
	dsaButton.classList.remove('error');
	dsaButton.innerHTML = 'Loading...';

	let storage_result = await chrome.storage.local.get(['email', 'sender', 'country']);
	console.log(storage_result);
	if (!isStorageViable(storage_result)) return showError('Please enter email/sender/country in popup', dsaButton, 'DSA Report');

	let all_flags = JSON.parse(localStorage.getItem('user-flags'));

	if (!Object.keys(all_flags).includes(user_id)) return showError('Please choose one or more flag', dsaButton, 'DSA Report');

	if (
		document.querySelector(
			'#right-navigation-header > div.navbar-right.rbx-navbar-right > ul > div.age-bracket-label.text-header > a > span.text-overflow.age-bracket-label-username.font-caption-header'
		) == null
	)
		return showError('Please log in', dsaButton, 'DSA Report', 5);

	let flags = all_flags[user_id];
	let template = await generateTemplate('template-profile.txt', flags, storage_result.sender.trim());

	// Check if server is running
	let ping_result = await pingServer({ ping: true });
	if (!ping_result) return showError('Please turn on python flask server', dsaButton, 'DSA Report');

	let result = await pingServer({
		ping: false,
		send_report: true,
		report_type: 'profile',
		id: user_id,
		template: template,
		sender: storage_result.sender.trim(),
		email: storage_result.email.trim(),
		country: storage_result.country.trim(),
	});

	let json = JSON.parse(result);
	console.log(json);
	if (json.error) {
		if (json.type == 'mismatched-countries') {
			setCountries(json.countries);
		}

		showError(getServerError(json), dsaButton, 'DSA Report', 3);
	} else {
		saveUserReport(user_id);

		checkLastReport();

		dsaButton.innerHTML = 'DSA Report';
	}
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
