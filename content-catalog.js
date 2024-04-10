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

		button.addEventListener('click', async () => {
			button.classList.remove('error');
			button.innerHTML = 'Loading...';

			let storage_result = await chrome.storage.local.get(['email', 'sender', 'country']);
			if (!isStorageViable(storage_result)) return showError('Please enter email/sender/country in popup', button, 'DSA Report');
			let ping_result = pingServer({ ping: true });
			if (!ping_result) return showError('Please turn on python flask server', button, 'DSA Report');

			let template = await generateTemplate('template-catalog.txt', [], storage_result.sender.trim());
			let result = await pingServer({
				ping: false,
				send_report: true,
				report_type: 'catalog',
				url: window.location.href,
				sender: storage_result.sender.trim(),
				email: storage_result.email.trim(),
				country: storage_result.country.trim(),
				template: template,
			});

			let json = JSON.parse(result);
			console.log(json);
			if (json.error) {
				if (json.type == 'mismatched-countries') {
					setCountries(json.countries);
				}

				showError(getServerError(json), dsaButton, 'DSA Report', 3);
			} else {
				button.innerHTML = 'DSA Report';
			}
		});
	},
	1000,
	9000
);
