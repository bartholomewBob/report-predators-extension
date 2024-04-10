let email = document.querySelector('#dsa-email');
let sender = document.querySelector('#standard-name');
let country = document.querySelector('#country');

let default_countries = [
	'Austria',
	'Belgium',
	'Bulgaria',
	'Croatia',
	'Cyprus',
	'Czechia',
	'Denmark',
	'Estonia',
	'Finland',
	'France',
	'Germany',
	'Greece',
	'Hungary',
	'Iceland',
	'Ireland',
	'Italy',
	'Latvia',
	'Liechtenstein',
	'Lithuania',
	'Luxembourg',
	'Malta',
	'Netherlands',
	'Norway',
	'Poland',
	'Portugal',
	'Romania',
	'Slovakia',
	'Slovenia',
	'Spain',
	'Sweden',
];

const template = (data) => {
	let template = document.createElement('template');
	template.innerHTML = data;
	return template.content;
};

email.addEventListener('change', (event) => {
	let email = event.target.value;
	chrome.storage.local.set({
		'email': email,
	});
});

sender.addEventListener('change', (event) => {
	let sender = event.target.value;
	chrome.storage.local.set({
		'sender': sender,
	});
});

country.addEventListener('change', (event) => {
	let country = event.target.value;
	console.log(country);

	if (country == 'Select a country') {
		country = '';
	}

	console.log(country);
	chrome.storage.local.set({
		'country': country,
	});
});

chrome.storage.local.get(['email', 'sender', 'country', 'countries'], (result) => {
	email.value = result.email || '';
	sender.value = result.sender || '';

	let countries = result.countries || default_countries;

	for (let country_name of countries) {
		let option = template(`<option value="${country_name}">${country_name}</option>`);
		country.appendChild(option);
	}

	country.value = result.country || '';
});
