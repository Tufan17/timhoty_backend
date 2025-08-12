import OfferModel from "../models/Admin/OfferModel";

const OfferService = async () => {
  try {
    const offers = await new OfferModel().getAll([], {
      end_date: {
        $lte: new Date(),
    },
    });
  } catch (error) {
    console.log(error);
  }
};

export default OfferService;