import React, { ErrorInfo } from 'react'
import { Button, Container, Typography } from '@mui/material'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string | null
}

interface ErrorDisplayProps {
  message: string | null
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  const handleRetry = () => {
    window.location.href = '/'
  }

  return (
    <Container
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          textAlign: 'center',
        }}
      >
        Something went wrong: {message}
      </Typography>
      <Button variant="contained" color="primary" onClick={handleRetry}>
        Reload the app
      </Button>
    </Container>
  )
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: null,
    }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error or send it to an error reporting service
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorDisplay message={this.state.errorMessage} />
    }

    return this.props.children as React.ReactNode // Type assertion
  }
}

export default ErrorBoundary
