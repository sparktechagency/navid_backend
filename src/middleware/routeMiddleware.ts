import express, { Express } from "express";
import path from "path";
import { auth_router } from "../apis/Auth/auth_route";
import { banner_router } from '../apis/Banner/banner_route';
import { business_router } from "../apis/Business/business_route";
import { cart_router } from "../apis/Cart/cart_route";
import { category_router } from "../apis/Category/category_route";
import { notification_router } from "../apis/Notifications/notification_route";
import { order_router } from "../apis/Order/order_route";
import { overview_router } from "../apis/Overview/overview_route";
import { payment_route } from "../apis/Payment/payment_route";
import { pick_address_router } from "../apis/PickUpPoint/pick_address_route";
import { product_router } from "../apis/Product/product_route";
import { review_router } from "../apis/Review/review_route";
import { service_router } from "../apis/Service/service_route";
import { setting_router } from "../apis/Setting/setting_router";
import { shipping_address_router } from "../apis/ShippingAddress/shipping_address_route";
import { verification_router } from "../apis/Verification/verification_route";
import { variants_router } from "../apis/variants/variants_route";

export const routeMiddleware = (app: Express) => {
  app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

  app.use(auth_router);
  app.use(verification_router);
  app.use(category_router);
  app.use(service_router);
  app.use(review_router);
  app.use(notification_router);
  app.use(setting_router);
  app.use(overview_router);
  app.use(payment_route);
  app.use(cart_router);
  app.use(order_router);
  app.use(shipping_address_router);
  app.use(product_router);
  app.use(business_router);
  app.use(pick_address_router);
  app.use(banner_router)
  app.use(variants_router)
};
