import AgreementModel from "../models/Admin/AgreementModel";
import DealerWalletModel from "../models/Admin/DealerWalletModel";
import DealerModel from "../models/Dealer/DealerModel";

const AgreementService = async () => {
  try {
    const dealers = await new DealerModel().getAll();
    for (const dealer of dealers) {
      const dealerWallets = await new DealerWalletModel().getAll([], {
        created_at: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lte: new Date(),
        },
        dealer_id: dealer.id,
      });

      let totalPrice = 0;
      let totalSell = 0;
      let totalCancel = 0;

      dealerWallets.forEach(async (dealerWallet) => {
        if (dealerWallet.type == "sell") {
          totalSell += dealerWallet.price;
        } else {
          totalCancel += dealerWallet.price;
        }
      });

      totalPrice = totalSell - totalCancel;

      await new AgreementModel().create({
        dealer_id: dealer.id,
        dealer_agreement: "waiting",
        admin_id: null,
        admin_agreement: "waiting",
        receipt_id: null,
        price: totalPrice,
        date: new Date(),
      });

      console.log(`Agreement created for dealer ${dealer.name}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export default AgreementService;
