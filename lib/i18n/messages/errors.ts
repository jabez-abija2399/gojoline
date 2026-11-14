// Error-page strings live in their own small module so client error boundaries
// can import them without pulling the full catalogs into the browser bundle.
export const errorMessages = {
  en: {
    notFoundTitle: "Page not found",
    notFoundBody: "We couldn't find that page.",
    serverTitle: "Something went wrong",
    serverBody: "We're fixing it. Please try again in a moment.",
    retry: "Try again",
    backHome: "Back to home",
  },
  am: {
    notFoundTitle: "ገጹ አልተገኘም",
    notFoundBody: "የፈለጉትን ገጽ ማግኘት አልቻልንም።",
    serverTitle: "የሆነ ችግር ተፈጥሯል",
    serverBody: "እያስተካከልነው ነው። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",
    retry: "እንደገና ይሞክሩ",
    backHome: "ወደ መነሻ ገጽ ይመለሱ",
  },
};
