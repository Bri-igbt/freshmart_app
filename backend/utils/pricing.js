export const getDeliveryFee = () => {
  const fee = Number(process.env.DELIVERY_FEE);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
};
