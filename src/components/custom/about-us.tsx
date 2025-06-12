"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export default function AboutAutoPartsShop() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 space-y-2 p-2 md:p-8">
      <div className="space-y-1 text-center">
        <h1 className="text-primary text-2xl font-bold md:text-3xl">
          Megha Sales Corporation
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Your Trusted Wholesale Auto Parts Partner
        </p>
      </div>

      <Card className="p-0">
        <CardContent className="space-y-2 p-3">
          <p className="text-sm leading-relaxed md:text-base">
            At <strong>Megha Sales Corporation</strong>, we specialize in
            wholesale distribution of high-quality{" "}
            <strong>automobile spare parts</strong> for <strong>Light</strong>{" "}
            and <strong>Heavy Commercial Vehicles</strong>. We are your one-stop
            destination for reliable and performance-tested components.
          </p>
          <div>
            <h2 className="mb-2 text-lg font-semibold">🔧 Product Range</h2>
            <ul className="list-inside list-disc space-y-1 text-sm md:text-base">
              <li>Steering and Suspension parts</li>
              <li>Braking systems</li>
              <li>Clutch and Transmission parts</li>
              <li>Engine and Body parts</li>
              <li>Rubber and Plastic components</li>
            </ul>
          </div>
          <h2 className="mb-2 text-lg font-semibold">
            🌟 Brands We Deal In {!expanded && "..."}
          </h2>

          {!expanded && (
            <div className="text-center">
              <Button
                className="text-primary"
                variant="ghost"
                onClick={() => setExpanded(true)}
              >
                <ChevronDownIcon className="text-primary" />
                Read More
              </Button>
            </div>
          )}

          {expanded && (
            <>
              <div>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-1 text-sm font-medium">LCV Brands</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">TechNix</Badge>
                      <Badge variant="outline">Super Circle</Badge>
                      <Badge variant="outline">Ktek</Badge>
                      <Badge variant="outline">Autokoi</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-1 text-sm font-medium">HCV Brands</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Orbit</Badge>
                      <Badge variant="outline">NXT</Badge>
                      <Badge variant="outline">ASK Fras-Le</Badge>
                      <Badge variant="outline">Accurub</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-1 text-sm font-medium">
                      LCV & HCV Brands
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Mansarovar</Badge>
                      <Badge variant="outline">Bulldog</Badge>
                      <Badge variant="outline">ACEY (AEPL)</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="mb-2 text-lg font-semibold">
                  🚛 Why Choose Us?
                </h2>
                <ul className="list-inside list-disc space-y-1 text-sm md:text-base">
                  <li>Bulk availability of top-grade spare parts</li>
                  <li>100% genuine branded products</li>
                  <li>Competitive wholesale pricing</li>
                  <li>Prompt delivery & support</li>
                  <li>
                    Serving retailers, garages, fleet operators & distributors
                  </li>
                </ul>
              </div>

              <div className="space-y-1 pt-4 text-center">
                <p className="text-sm font-medium md:text-base">
                  Let’s power your vehicles together. 🚚
                </p>
                <p className="text-muted-foreground text-sm">
                  Contact us today or visit our warehouse to explore our wide
                  product range.
                </p>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setExpanded(false)}
                  className="text-primary"
                >
                  <ChevronUpIcon className="text-primary" />
                  Show Less
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
