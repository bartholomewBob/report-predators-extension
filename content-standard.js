let data = JSON.parse(localStorage.getItem('reporting') || '{}');

if (Object.keys(data).length != 0) {
	let user_id = window.location.href.match(/\d+/)[0];
	if (user_id == data.id) {
		let all_flags = JSON.parse(localStorage.getItem('user-flags'));

		let flags = all_flags[user_id];
		console.log(data);

		document.querySelector('#ReportCategory > option:nth-child(2)').selected = 'selected';
		document.querySelector('#ReportCategory').value = 1;

		document.querySelector('#Comment').value = 'Loading...';
		chrome.storage.local.get('sender', async (result) => {
			let template = await generateTemplate('template-profile.txt', flags, result.sender.trim());
			document.querySelector('#Comment').value = template;
		});
	}
}
