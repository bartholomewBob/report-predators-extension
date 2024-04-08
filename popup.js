let email = document.querySelector('#dsa-email');
let sender = document.querySelector('#standard-name');
let country = document.querySelector('#country');

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
	chrome.storage.local.set({
		'country': country,
	});
});

chrome.storage.local.get(['email', 'sender', 'country'], (result) => {
	email.value = result.email || '';
	sender.value = result.sender || '';
	country.value = result.country || '';
});
