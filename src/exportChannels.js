const axios = require('axios');
const fs = require('fs-extra');
const reduce = require('lodash/reduce');

module.exports = async (userId, outFileGlob, options) => {
	if (!options.token) {
		console.log('[Error] --token is required');
		return;
	}

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${options.token}`,
	};

	let channels = [];
	let blocks = [];

	try {
		console.log(`[User ${userId}]: Fetching channels...`);

		// TODO: make work with more than one page of channels
		const {data} = await axios.get(
			`http://api.are.na/v2/users/${userId}/channels?page=1&per=100`,
			{
				headers,
			},
		);

		channels = data.channels;
	} catch (error) {
		console.log(error);
	}

	try {
		const blockRequests = channels.map(c => {
			let page = 1;
			let per = 100;
			let contents = [];

			return new Promise(resolve => {
				const fetchNextPage = async () => {
					console.log(
						`[Channel ${c.title}]: Fetching blocks p.${page}...`,
					);

					const {data} = await axios.get(
						`http://api.are.na/v2/channels/${c.id}/contents?page=${page}&per=${per}`,
						{
							headers,
						},
					);

					if (data.contents && data.contents.length) {
						contents = [...contents, ...data.contents];
						page++;

						return fetchNextPage();
					} else {
						return resolve(contents);
					}
				};

				return fetchNextPage();
			});
		});

		const blocksByChannelIndex = await Promise.all(blockRequests);

		blocks = reduce(
			blocksByChannelIndex,
			(allBlocks, channelBlocks, index) => {
				const channel = channels[index];
				const blocks = channelBlocks.map(b =>
					Object.assign({}, b, {
						channel: {
							title: channel.title,
						},
					}),
				);

				return [...allBlocks, ...blocks];
			},
			[],
		);
	} catch (error) {
		console.log(error);
	}

	const blocksJson = blocks.map(
		({id, title, description, channel, source, image}) => ({
			id,
			title,
			description,
			channel: channel.title,
			url: source ? source.url : '',
			image: image ? image.original.url : '',
		}),
	);

	try {
		await fs.outputFile(outFileGlob, JSON.stringify(blocksJson));
	} catch (error) {
		error;
	}
};
