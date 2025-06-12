"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MapPin,
  User2Icon,
  StoreIcon,
  FootprintsIcon,
} from "lucide-react";
import Image from "next/image";
import WhatsappIcon from "@/assets/icons/whatsapp.png";
import BhagwanSlok from "@/assets/icons/bhagwan-slok.svg";
import GoogleMapComponent from "@/components/custom/google-map";
import { EnquiryDialog } from "@/components/custom/wa-enquiry-dialog";

export default function AboutAndContact() {
  return (
    <div className="container mx-auto flex max-w-2xl flex-col p-4 overflow-auto">
      <div className="relative size-15 w-full">
        <Image alt="" src={BhagwanSlok} fill />
        <Image alt="" src={BhagwanSlok} fill />
      </div>
      <h2 className="text-primary mb-4 text-center text-2xl font-semibold">
        Megha Sales Corporation
      </h2>
      <div className="text-muted-foreground flex w-full flex-col items-start justify-center gap-4">
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <p className="flex items-center gap-2 text-sm font-normal">
            <StoreIcon className="size-4" />
            Proprietorship :{" "}
          </p>
          <div className="text-primary/70 flex w-full flex-col gap-1 text-sm font-semibold">
            <p className="flex items-center justify-start gap-2">
              <User2Icon className="size-5" />
              <span className="text-base font-semibold">Yashwant Jain</span>
            </p>
            <div className="flex w-full items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-base">
                <Phone className="size-5" />
                +91-9425505557
              </p>
              <EnquiryDialog
                trigger={
                  <Button
                    variant="outline"
                    className="h-0 min-h-0 w-fit gap-2 rounded-full border-green-600 p-3 px-5 text-green-700"
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
              yashwantraipur@gmail.com
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start gap-2">
          <p className="flex items-center justify-start gap-2 text-sm">
            <FootprintsIcon className="size-4" /> Find us here
          </p>
          <p className="text-primary/70 flex items-start justify-start gap-2 text-sm font-semibold">
            <MapPin className="size-8" />
            <span className="">
              Shop No.140, Eskay Plaza Complex, New Bombay Market Road, Raipur,
              Chhattisgarh 492001
            </span>
          </p>
          <GoogleMapComponent
            address="Megha Sales Corporation Shop No.140, Eskay Plaza Complex, New Bombay Market Road, Raipur,
              Chhattisgarh 492001"
          />
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
                  className="w-full gap-4 border-green-600 text-green-700"
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
