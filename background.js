const getPort = () => {
	return new Promise((resolve, reject) => {
		fetch('./port.txt')
			.then(async (response) => {
				let port = await response.text();
				resolve(port.trim() || 8080);
			})
			.catch(reject);
	});
};

const getUrl = async () => {
	let port = await getPort();
	return `http://127.0.0.1:${port}/`;
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.ping) {
		getUrl().then((url) => {
			console.log(url);

			console.log(
				fetch(url, {
					method: 'GET',
				})
			);

			fetch(url, {
				method: 'GET',
			})
				.then((result) => {
					console.log(result);
					if (result.ok && result.status == 200) {
						sendResponse(true);
					} else {
						sendResponse(false);
					}
				})
				.catch((error) => {
					console.log(error);
					sendResponse(false);
				});
		});
	} else {
		getUrl().then((url) => {
			console.log('yo');
			fetch(url, {
				method: 'POST',
				body: JSON.stringify(request),
			})
				.then(async (result) => {
					console.log(result);
					let text = await result.text();

					sendResponse(text);
				})
				.catch(console.log);
		});
	}

	return true;
});
