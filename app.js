import express from 'express';
import { Skolengo } from 'scolengo-api';
import basicAuth from 'express-basic-auth';
import { config as dotenvConfig } from 'dotenv';
import { writeFileSync } from 'fs';

dotenvConfig();

const app = express();

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const users = { [username]: password };

const config = {
  "tokenSet": {
    "access_token": process.env.ACCESS_TOKEN,
    "id_token": process.env.ID_TOKEN,
    "refresh_token": process.env.REFRESH_TOKEN,
    "token_type": process.env.TOKEN_TYPE,
    "expires_at": process.env.EXPIRES_AT,
    "scope": process.env.SCOPE
  },
  "school": {
    "id": process.env.ID,
    "name": process.env.NAME,
    "addressLine1": process.env.ADDRESS_LINE_1,
    "addressLine2": process.env.ADDRESS_LINE_2,
    "addressLine3": process.env.ADDRESS_LINE_3,
    "zipCode": process.env.ZIP_CODE,
    "city": process.env.CITY,
    "country": process.env.COUNTRY,
    "homePageUrl": process.env.HOME_PAGE_URL,
    "emsCode": process.env.EMS_CODE,
    "emsOIDCWellKnownUrl": process.env.EMS_OIDC_WELL_KNOWN_URL
  }
}

const sko = await Skolengo.fromConfigObject(config, { onTokenRefresh: (tokenSet) => {
  config.tokenSet = tokenSet
  writeFileSync("./tokenset.json", JSON.stringify(config))
}});

app.use(basicAuth({
  users: users,
  challenge: true,
  realm: 'Protected Area'
}));

app.get('/agenda', async (req, res) => {
  try {
    const user = await Skolengo.fromConfigObject(config);
    const infoUser = await user.getUserInfo();

    const today = new Date();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 7);
    const endDay = new Date(today);
    endDay.setMonth(startDay.getMonth() + 2);
    const startDate = formatDate(startDay);
    const endDate = formatDate(endDay);

    const studentId = infoUser.id;
    const agenda = await user.getAgenda(studentId, startDate, endDate);

    res.setHeader('Content-Type', 'text/calendar');
    res.send(agenda.toICalendar());
  } catch (error) {
    console.error('Erreur lors de la génération de l\'agenda :', error);
    res.status(500).send('Erreur lors de la génération de l\'agenda');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
