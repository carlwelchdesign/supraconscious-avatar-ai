"use client"

import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import { useServerInsertedHTML } from "next/navigation"
import { useState } from "react"

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f6f1ea",
      paper: "#fffaf4",
    },
    primary: {
      main: "#2b1b35",
    },
    secondary: {
      main: "#9a6a44",
    },
    text: {
      primary: "#2b1b35",
      secondary: "#76627f",
    },
    divider: "rgba(43, 27, 53, 0.12)",
  },
  shape: {
    borderRadius: 8,
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
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
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
