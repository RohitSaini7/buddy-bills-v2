"use client";

import React, { useState } from "react";
import { User } from "lucide-react";
import { Slider } from "@components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Progress } from "@components/ui/progress";

export function SplitDemo() {
  const [amount, setAmount] = useState(120);
  const [splitType, setSplitType] = useState<"equal" | "uneven">("equal");

  const splitValues =
    splitType === "equal"
      ? {
          you: (amount / 3).toFixed(2),
          kabir: (amount / 3).toFixed(2),
          geeta: (amount / 3).toFixed(2),
          percentages: [33.3, 33.3, 33.3],
        }
      : {
          you: (amount * 0.5).toFixed(2),
          kabir: (amount * 0.2).toFixed(2),
          geeta: (amount * 0.3).toFixed(2),
          percentages: [50, 20, 30],
        };

  return (
    <Card className="w-full max-w-md shadow-xl relative overflow-hidden rounded-2xl border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-6 space-y-0">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Interactive Demo
        </CardTitle>
        <Tabs value={splitType} onValueChange={(val) => setSplitType(val as "equal" | "uneven")}>
          <TabsList className="h-8">
            <TabsTrigger value="equal" className="text-xs">
              Equal
            </TabsTrigger>
            <TabsTrigger value="uneven" className="text-xs">
              Uneven
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Total Bill</span>
            <span className="text-2xl font-bold font-mono text-primary">${amount}.00</span>
          </div>
          <Slider
            id="split-amount"
            min={10}
            max={1000}
            step={10}
            value={[amount]}
            onValueChange={(val) => setAmount(val[0])}
            aria-label="Adjust split amount"
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>$10</span>
            <span>$500</span>
            <span>$1000</span>
          </div>
        </div>

        <div className="space-y-4">
          <span className="text-sm font-semibold text-muted-foreground block">
            Calculated Splits
          </span>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
                    Y
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">You (soup)</span>
              </div>
              <span className="font-bold font-mono text-foreground">${splitValues.you}</span>
            </div>
            <Progress value={splitValues.percentages[0]} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="bg-blue-500/20 text-blue-500 text-[10px] font-semibold">
                    K
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">Kabir (salad)</span>
              </div>
              <span className="font-bold font-mono text-foreground">${splitValues.kabir}</span>
            </div>
            <Progress value={splitValues.percentages[1]} indicatorClassName="bg-blue-500" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="bg-amber-500/20 text-amber-500 text-[10px] font-semibold">
                    G
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">Geeta (pasta)</span>
              </div>
              <span className="font-bold font-mono text-foreground">${splitValues.geeta}</span>
            </div>
            <Progress value={splitValues.percentages[2]} indicatorClassName="bg-amber-500" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>
            {splitType === "equal"
              ? "Equal split dividing total evenly 3 ways."
              : "Uneven split mapping exact personal orders."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
