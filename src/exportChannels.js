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
		const {data} = await axios.get(
			`http://api.are.na/v2/users/${userId}/channels?page=1&per=10000`,
			{
				headers,
			},
		);

		channels = data.channels;
	} catch (error) {
		console.log(error);
	}

	try {
		const blockRequests = channels.map(c =>
			axios.get(
				`http://api.are.na/v2/channels/${c.id}/contents?page=1&per=10000`,
				{
					headers,
				},
			),
		);

		const blockResponses = await Promise.all(blockRequests);

		const blocksByChannelIndex = blockResponses.map(
			res => res.data.contents,
		);

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
		console.log(error);
	}
};
