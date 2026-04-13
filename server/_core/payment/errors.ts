import type { PaymentErrorCode } from "@shared/paymentTypes";

export class PaymentLayerError extends Error {
  readonly code: PaymentErrorCode;
  readonly httpStatus: number;

  constructor(code: PaymentErrorCode, message: string, httpStatus = 400) {
    super(message);
    this.name = "PaymentLayerError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
