"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  User2Icon,
  StoreIcon,
  FootprintsIcon,
  MapPinIcon,
} from "lucide-react";
import Image from "next/image";
import WhatsappIcon from "@/assets/icons/whatsapp.png";
import BhagwanSlok from "@/assets/icons/bhagwan-slok.svg";
import JainLogo from "@/assets/icons/jain-logo.svg";
import GoogleMapComponent from "@/components/custom/google-map";
import { EnquiryDialog } from "@/components/custom/wa-enquiry-dialog";
import AboutAutoPartsShop from "@/components/custom/about-us";

export default function AboutAndContact() {
  return (
    <div className="container mx-auto flex max-w-4xl flex-col overflow-auto p-4">
      <div className="flex w-full items-center justify-between space-y-2">
        <div className="relative size-15">
          <Image alt="" src={JainLogo} fill />
          <Image alt="" src={JainLogo} fill />
          <Image alt="" src={JainLogo} fill />
          <Image alt="" src={JainLogo} fill />
        </div>
        <div className="relative size-15 w-full">
          <Image alt="" src={BhagwanSlok} fill />
          <Image alt="" src={BhagwanSlok} fill />
          <Image alt="" src={BhagwanSlok} fill />
          <Image alt="" src={BhagwanSlok} fill />
        </div>
        <div className="relative size-15">
          <Image alt="" src={JainLogo} fill />
          <Image alt="" src={JainLogo} fill />
          <Image alt="" src={JainLogo} fill />
          <Image alt="" src={JainLogo} fill />
        </div>
      </div>
      {/* <h2 className="text-primary mb-4 text-center text-2xl md:text-3xl font-semibold">
        Megha Sales Corporation
      </h2> */}
      <AboutAutoPartsShop />
      <div className="text-muted-foreground mt-4 flex w-full flex-col items-start justify-center gap-4 px-4">
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <p className="flex items-center gap-2 text-sm font-normal">
            <StoreIcon className="size-4" />
            Proprietorship :{" "}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-8 md:gap-16 w-full">
            <div className="text-primary/95 flex w-full flex-col gap-1 text-sm font-semibold">
              <p className="flex items-center justify-start gap-2">
                <User2Icon className="size-5" />
                <span className="text-base font-semibold">Yashwant Jain</span>
              </p>
              <div className="flex w-full items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-base">
                  <Phone className="size-5" />
                  <span className="">+91-9425505557</span>
                </p>
                <EnquiryDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="h-0 min-h-0 w-fit gap-2 rounded-full border-green-600 p-3 px-5 text-green-600"
                    >
                      <div className="relative size-4">
                        <Image src={WhatsappIcon} alt="" fill />
                      </div>
                      Contact
                    </Button>
                  }
                />
              </div>
              <p className="flex items-center gap-2 text-base">
                <Mail className="size-5" />
                <span className="">yashwantraipur@gmail.com</span>
              </p>
            </div>
            {/* <Separator /> */}
            <div className="text-primary/95 flex w-full flex-col gap-1 text-sm font-semibold">
              <p className="flex items-center justify-start gap-2">
                <User2Icon className="size-5" />
                <span className="text-base font-semibold">Pratham Jain</span>
              </p>
              <div className="flex w-full items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-base">
                  <Phone className="size-5" />
                  <span className="">+91-9589143377</span>
                </p>
                <EnquiryDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="h-0 min-h-0 w-fit gap-2 rounded-full border-green-600 p-3 px-5 text-green-600"
                    >
                      <div className="relative size-4">
                        <Image src={WhatsappIcon} alt="" fill />
                      </div>
                      Contact
                    </Button>
                  }
                />
              </div>
              <p className="flex items-center gap-2 text-base">
                <Mail className="size-5" />
                <span className="">prathamjain01@gmail.com</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-2">
          <p className="flex items-center justify-start gap-2 text-sm">
            <FootprintsIcon className="size-4" /> Find us here
          </p>
          <div className="justify-ceenter flex w-full flex-col items-center gap-2 md:flex-row">
            <div className="text-primary/90 flex items-start justify-start gap-2 font-semibold md:w-1/4">
              <MapPinIcon className="size-6 md:size-20" />
              <span className="text-sm">
                Shop No.140, Eskay Plaza Complex, New Bombay Market Road,
                Raipur, Chhattisgarh 492001
              </span>
            </div>
            <GoogleMapComponent
              address="Megha Sales Corporation Shop No.140, Eskay Plaza Complex, New Bombay Market Road, Raipur,
              Chhattisgarh 492001"
            />
          </div>
        </div>
      </div>

      <Separator />
      <Card className="mt-4 p-4">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground text-sm">
              Please reach out with any queries or feedback. We will get back to
              you as soon as possible.
            </p>
            <EnquiryDialog
              trigger={
                <Button
                  variant="outline"
                  className="w-full gap-4 border-green-600 text-green-600"
                >
                  <div className="relative size-5">
                    <Image src={WhatsappIcon} alt="" fill />
                  </div>
                  Enquire on WhatsApp
                </Button>
              }
            />
          </div>

          {/* {showForm && (
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Name
                </label>
                <Input id="name" name="name" type="text" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium">
                  Message
                </label>
                <Textarea id="message" name="message" rows={4} required />
              </div>
              <Button type="submit">Send</Button>
            </form>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}
