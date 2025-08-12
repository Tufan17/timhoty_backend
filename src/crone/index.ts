import cron from 'node-cron';
import OfferService from '../services/OfferService';
import AgreementService from '@/services/AgreementService';



// Her Gün Saat 10:00 çalıştı.
cron.schedule('0 10 * * *', () => {
  OfferService();
});


// Her ayın 1. günü saat 00:00 çalıştı.
cron.schedule('0 0 1 * *', () => {
  AgreementService();
});
  

