import cron from 'node-cron';
import { sendForgetNotifications } from './forget';


// Her 1 dakikada bir çalıştı.
cron.schedule('* * * * *', () => {
	// sendForgetNotifications();
});


// Her Gün Saat 10:00 çalıştı.
cron.schedule('0 10 * * *', () => {
});


// Her ayın 1. günü saat 00:00 çalıştı.
cron.schedule('0 0 1 * *', () => {
});
  

