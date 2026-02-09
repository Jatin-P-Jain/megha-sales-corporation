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
import Link from "next/link";
import BankDetails from "@/components/custom/bank-details";

export default function AboutAndContact() {
  return (
    <div className="container mx-auto flex max-w-4xl flex-col overflow-auto p-4 gap-4">
      <div className="flex w-full items-center justify-between space-y-1">
        <div className="relative">
          <Image alt="" src={JainLogo} width={30} height={30} />
        </div>
        <div className="relative">
          <Image alt="" src={BhagwanSlok} width={120} height={120} />
        </div>
        <div className="relative">
          <Image alt="" src={JainLogo} width={30} height={30} />
        </div>
      </div>
      <AboutAutoPartsShop />
      <BankDetails />
      <div className="text-muted-foreground flex w-full flex-col items-start justify-center gap-4 px-4">
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <p className="flex items-center gap-2 text-sm font-normal">
            <StoreIcon className="size-4" />
            Proprietorship :{" "}
          </p>
          <div className="grid w-full grid-cols-1 items-center justify-center gap-8 md:grid-cols-2 md:gap-16">
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
                      <div className="relative">
                        <Image
                          src={WhatsappIcon}
                          alt=""
                          width={15}
                          height={15}
                        />
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
                      <div className="relative">
                        <Image
                          src={WhatsappIcon}
                          alt=""
                          width={15}
                          height={15}
                        />
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
                  <div className="relative">
                    <Image src={WhatsappIcon} alt="" width={20} height={20} />
                  </div>
                  Enquire on WhatsApp
                </Button>
              }
            />
          </div>
          <Separator className="my-4" />
          <div className="text-primary flex w-full items-center justify-center gap-2 text-center text-xs">
            <span className="text-lg">✨</span>{" "}
            <div className="flex flex-col items-center gap-1 md:flex-row">
              Thoughtfully designed and developed with passion and ❤️ by{" "}
              <div className="flex items-center gap-1">
                <Link
                  href="https://www.jatinprakash.online"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-[14px] font-semibold">
                    Jatin Prakash Jain
                  </span>
                </Link>
              </div>
            </div>
            <span className="text-lg">✨</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
