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

const pingServer = (data) => {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(data, function (response) {
			resolve(response);
		});
	});
};

const setCountries = (countries) => {
	chrome.storage.local.set({
		'country': '',
		'countries': countries,
	});
};

const showError = (error, button, text, delay = 1) => {
	button.innerHTML = error;
	button.classList.add('error');
	setTimeout(function () {
		button.innerHTML = text;
		button.classList.remove('error');
	}, delay * 1000);
};

const isStorageViable = (result) => {
	return !(
		!Object.keys(result).includes('email') ||
		!Object.keys(result).includes('sender') ||
		!Object.keys(result).includes('country') ||
		result.email.trim() == '' ||
		result.sender.trim() == '' ||
		result.country.trim() == ''
	);
};

const getServerError = (json) => {
	const errors = {
		'outdated-driver': 'Outdated chrome/chromedriver, please update chrome and your chromedriver',
		'closed': 'Webdriver was closed',
		'no-driver': "Can't find driver, please install from the official site",
		'network': 'Connection failed. Try changing VPN/Proxy',
		'driver-open': 'Failed to open driver, a current one is open',
		'driver-limit': `Reached driver limit of ${Object.keys(json).includes('limit') ? json.limit : '???'} driver(s)`,
		'bad-proxy': 'Proxy error. Please retry after changing proxy',
		'mismatched-countries': 'Country not found in dropdown menu, updating country list. Please change country and try again',
		'unknown': 'An unknown error has occured',
	};

	return errors[type];
};

const getStoredFlags = (storage_id) => {
	return JSON.parse(localStorage.getItem(storage_id) || '{}');
};

const generateTemplate = (file, flags, sender) => {
	return new Promise((resolve, reject) => {
		if (flags.length > 1) {
			flags[flags.length - 1] = 'and ' + flags[flags.length - 1];
		}

		flags = flags.join(flags.length == 2 ? ' ' : ', ');

		pingServer({
			template: true,
			file: file,
		})
			.then((template) => {
				let result = template;

				console.log(`got template for ${file}`);

				console.log(result);

				result = result.replace('${flags}', flags);
				result = result.replace('${sender}', sender);

				resolve(result);
			})
			.catch(reject);
	});
};

const saveUserReport = (user_id) => {
	let reports = JSON.parse(localStorage.getItem('reports') || '[]');

	let index = reports.findIndex((report) => report.user == user_id);

	if (index != -1) {
		reports[index] = {
			user: user_id,
			reports: reports[index].reports + 1,
			timestamp: Date.now(),
		};
	} else {
		reports.push({
			user: user_id,
			reports: 1,
			timestamp: Date.now(),
		});
	}

	localStorage.setItem('reports', JSON.stringify(reports));
};

const clean = (text) => {
	text = text.replace(/\n+/g, '\n');
	text = text.replace(/\s+/g, ' ');
	return text;
};

const formatUnix = (unix) => {
	let date = new Date(unix);
	let hours = date.getHours();
	let period = hours >= 12 ? 'PM' : 'AM';
	hours = hours > 12 ? hours - 12 : hours;
	let minutes = date.getMinutes().toString().padStart(2, '0');

	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();

	return `${hours}:${minutes} ${period} ${year}/${month}/${day}`;
};
