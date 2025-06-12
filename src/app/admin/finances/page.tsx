
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function AdminFinancesPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Финансы</h1>
        <p className="text-muted-foreground">
          Обзор финансовых потоков, доходов и расходов.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Финансовая Сводка</CardTitle>
          <CardDescription>Ключевые финансовые показатели.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                <CardHeader className="pb-2">
                    <CardDescription className="text-green-700 dark:text-green-400">Общий доход</CardDescription>
                    <CardTitle className="text-2xl text-green-800 dark:text-green-300">$125,780.50 (заглушка)</CardTitle>
                </CardHeader>
            </Card>
             <Card className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
                <CardHeader className="pb-2">
                    <CardDescription className="text-red-700 dark:text-red-400">Общие расходы</CardDescription>
                    <CardTitle className="text-2xl text-red-800 dark:text-red-300">$30,120.75 (заглушка)</CardTitle>
                </CardHeader>
            </Card>
          </div>
          <p className="text-muted-foreground">Детализированные отчеты о транзакциях, прибылях и убытках появятся здесь.</p>
          <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md text-center text-muted-foreground">
            Финансовые отчеты и графики (скоро)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    