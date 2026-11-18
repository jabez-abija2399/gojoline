import { HelpCircle, Heart, Lightbulb, TriangleAlert } from "lucide-react";
import type { FeedbackType } from "@/lib/feedback/types";

export const TYPE_ICONS: Record<FeedbackType, typeof Lightbulb> = { idea: Lightbulb, problem: TriangleAlert, praise: Heart, question: HelpCircle };
