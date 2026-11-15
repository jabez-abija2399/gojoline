// Error-page strings live in their own small module so client error boundaries
// can import them without pulling the full catalogs into the browser bundle.
export const errorMessages = {
  en: {
    notFoundTitle: "Page not found",
    notFoundBody: "We couldn't find that page.",
    serverTitle: "Something went wrong",
    serverBody: "We're fixing it. Please try again in a moment.",
    retry: "Try again",
    reference: "If this keeps happening, send us this number on Telegram (@gojoline_bot): {id}",
    home: "Go to the home page",
    backHome: "Back to home",
  },
  am: {
    notFoundTitle: "ገጹ አልተገኘም",
    notFoundBody: "የፈለጉትን ገጽ ማግኘት አልቻልንም።",
    serverTitle: "የሆነ ችግር ተፈጥሯል",
    serverBody: "እያስተካከልነው ነው። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",
    retry: "እንደገና ይሞክሩ",
    reference: "ይህ መደጋገሙን ከቀጠለ ይህን የማጣቀሻ ቁጥር በቴሌግራም (@gojoline_bot) ይላኩልን፦ {id}",
    home: "ወደ መነሻ ገጽ ይሂዱ",
    backHome: "ወደ መነሻ ገጽ ይመለሱ",
  },
};
