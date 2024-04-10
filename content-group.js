const group_id = window.location.href.match(/\d+/g)[0];

let flags = getStoredFlags('group-flags');
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
				let flags = getStoredFlags('group-flags');

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

		button.addEventListener('click', async () => {
			button.classList.remove('error');
			button.innerHTML = 'Loading...';

			let storage_result = await chrome.storage.local.get(['email', 'sender', 'country']);
			if (!isStorageViable(storage_result)) return showError('Please enter email/sender/country in popup', button, 'DSA Report');

			let all_flags = JSON.parse(localStorage.getItem('group-flags'));
			if (!Object.keys(all_flags).includes(group_id)) return showError('Please choose one or more flag', button, 'DSA Report');

			// Check if server is running
			let ping_result = await pingServer({ ping: true });
			if (!ping_result) return showError('Please turn on python flask server', button, 'DSA Report');

			let template = await generateTemplate('template-group.txt', all_flags[group_id], storage_result.sender.trim());

			let result = pingServer({
				ping: false,
				send_report: true,
				report_type: 'catalog',
				url: `https://www.roblox.com/groups/${group_id}`,
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
