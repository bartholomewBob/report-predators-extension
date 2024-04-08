let data = JSON.parse(localStorage.getItem('reporting') || '{}');

const clean = (text) => {
	text = text.replace(/\n+/g, '\n');
	text = text.replace(/\s+/g, ' ');
	return text;
};

const generateTemplate = (flags, sender) => {
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

	let template = `I am writing to report an account with an inappropriate ${info} on your platform. ${details}. The ${info} ${
		flags.length == 1 ? 'violates' : 'violate'
	} the community guidelines as ${flags.length == 1 ? 'it' : 'they'} ${flags.length == 1 ? 'contains' : 'contain'} offensive language/imagery not suitable for the platform.

I kindly request that the necessary actions be taken to address this issue promptly. This may include reaching out to the accountholder to change the inappropriate content to something more appropriate, or suspending the account entirely if deemed necessary.

Thank you for your attention to this matter. I believe by promptly addressing inappropriate content, we can contribute to a safer and respectful community.

${sender ? 'Sincerely,\n' + sender : ''}`;

	return template;
};

console.log(data);

const setInputValue = (input, value) => {
	input.focus();
	input.value = value;
	input.setAttribute('value', value);
};

const resetAll = (template, country, email) => {
	document.querySelector('#ChildSexualExploitation-radio').checked = true;
	document.querySelector('#ChildSexualExploitation-radio').setAttribute('checked', true);
	// document.querySelector('#ChildSexualExploitation-radio').setAttribute('checked', 'checked');
	setInputValue(document.querySelector('#url-input > input'), `https://www.roblox.com/users/${data.id}/profile`);
	document.querySelector('#illegal-description-input > textarea').innerHTML = template;
	setInputValue(document.querySelector('#reporter-info-email > input'), email);
	setInputValue(document.querySelector('#country-selection > div > select'), country);

	document.querySelector('#confirmCheckbox').checked = true;
	document.querySelector('#confirmCheckbox').setAttribute('checked', true);
};

let input = document.querySelector('#reporter-info-email > input');

setTimeout(function () {}, 1000);

console.log(input.value);
console.log(input.getAttribute('value'));

if (Object.keys(data).length != 0) {
	let all_flags = JSON.parse(localStorage.getItem('user-flags'));

	let flags = all_flags[data.id];

	setTimeout(function () {
		// document.querySelector('#submit-button > button').disabled = false;
		chrome.storage.local.get(['sender', 'email', 'country'], (result) => {
			let template = generateTemplate(flags, result.sender.trim());

			resetAll(template, result.country.trim(), result.email.trim());

			setInterval(() => {
				resetAll(template, result.country.trim(), result.email.trim());
			}, 100);
		});
	}, 5000);
}
