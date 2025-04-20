const { Ollama } = require('ollama');
require('dotenv').config();

const modelName = process.env.OLLAMA_MODAL;

class MyOllama extends Ollama {
	constructor(options) {
		super({
			host: process.env.OLLAMA_URL,
			...options,
		});
	}

	async preloadModel() {
		try {
			const running = await this.list();
			const isRunning = running.models.some(m => m.name.includes(modelName));

			if (isRunning) {
				console.log(`✅ Model "${modelName}" is already loaded.`);
			} else {
				console.log(`⏳ Loading model "${modelName}"...`);
				await this.create({ model: modelName });
				console.log(`✅ Model "${modelName}" loaded successfully.`);
			}
		} catch (err) {
			console.error('❌ Error while loading model:', err.message);
		}
	}

	async send(messages, options = {}) {
		await this.preloadModel();

		try {
			const res = await this.chat({
				model: modelName,
				messages,
				...options,
			});
			return res;
		} catch (err) {
			console.error('❌ Error during chat:', err.message);
			throw err;
		}
	}
}

module.exports = new MyOllama();
