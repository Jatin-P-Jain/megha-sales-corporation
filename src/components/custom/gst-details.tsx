"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface GstDetailsProps {
  data: any;
  loading?: boolean;
}

export function GstDetails({ data, loading = false }: GstDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 p-3 md:p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading GST details...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.flag !== true) {
    return (
      <Card>
        <CardContent className="text-destructive flex items-center justify-center gap-2 p-3 md:p-6">
          <AlertCircle className="h-6 w-6" />
          <span>Invalid GSTIN or no data</span>
        </CardContent>
      </Card>
    );
  }

  const { gstin, lgnm, tradeNam, sts, pradr, ctj, dty, rgdt, nba } = data.data;

  return (
    <Card className="mx-auto w-full gap-0 p-0">
      {/* Collapsed Header */}
      <CardHeader
        className="cursor-pointer py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="flex flex-1 items-center gap-3 w-full">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-base font-semibold md:text-lg">{tradeNam}</p>
              <p className="text-muted-foreground text-sm">{lgnm}</p>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {gstin}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Expandable Details */}
      {isExpanded && (
        <CardContent className="space-y-2 border-t pb-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">
                Legal Name
              </span>
              <p className="font-semibold">{lgnm}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">
                GSTIN
              </span>
              <p className="font-mono text-sm">{gstin}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Address
            </div>
            <p className="mt-1">{pradr?.adr || "N/A"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs font-medium">
                Status
              </span>
              <Badge variant={sts === "Active" ? "default" : "secondary"}>
                {sts}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs font-medium">
                Type
              </span>
              <p>{dty}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs font-medium">
                Reg. Date
              </span>
              <p>{rgdt}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs font-medium">
                Jurisdiction
              </span>
              <p className="truncate">{ctj}</p>
            </div>
          </div>

          {nba && nba.length > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">
                <Building2 className="mr-1 inline h-4 w-4" />
                Nature of Business
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {nba.map((nature: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {nature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
