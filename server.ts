import express from 'express';
import path from 'path';

const app = express();
const API_PORT = process.env.PORT || 3001;

app.use(express.static('./client/build'));
app.use(express.json());

import { router } from './server/routes';
app.use('/api', router);

app.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, './client/build/index.html'), (err) => {
		console.error(err);
		res.sendStatus(500);
	});
});

app.listen(API_PORT, () => console.log(`Listening on port ${API_PORT}`));