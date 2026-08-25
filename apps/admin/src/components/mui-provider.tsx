"use client"

import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import { useServerInsertedHTML } from "next/navigation"
import { useState } from "react"

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#050914",
      paper: "#121321",
    },
    primary: {
      main: "#c87432",
      contrastText: "#fff8ef",
    },
    secondary: {
      main: "#8f91e8",
    },
    text: {
      primary: "#f4ebdd",
      secondary: "#d8ccbd",
    },
    divider: "rgba(226, 199, 166, 0.18)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 650,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 650,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 650,
      letterSpacing: 0,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 650,
          minHeight: 44,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderColor: "rgba(226, 199, 166, 0.18)",
        },
      },
    },
  },
})

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "mui", prepend: true })
    cache.compat = true
    const prevInsert = cache.insert
    let inserted: string[] = []
    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1]
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const prev = inserted
      inserted = []
      return prev
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (names.length === 0) return null
    let styles = ""
    for (const name of names) {
      styles += cache.inserted[name]
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}
