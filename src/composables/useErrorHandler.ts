import type { AxiosError } from 'axios'

export interface ValidationError {
  field: string
  message: string
}

export interface ErrorDetails {
  message: string
  statusCode?: number
  validationErrors?: ValidationError[]
  originalError?: any
}

/**
 * Composable for error handling and translation
 *
 * @example
 * ```ts
 * const { translateErrorMessage, extractValidationErrors, getErrorDetails } = useErrorHandler()
 *
 * try {
 *   await apiCall()
 * } catch (error) {
 *   const message = translateErrorMessage(error)
 *   showError(message)
 *
 *   // For form validation errors
 *   const validationErrors = extractValidationErrors(error)
 *   if (validationErrors) {
 *     formErrors.value = validationErrors
 *   }
 * }
 * ```
 */
export function useErrorHandler() {
  /**
   * Translate error to user-friendly message
   * @param error - Error object (AxiosError, Error, string, or unknown)
   * @returns User-friendly error message
   */
  function translateErrorMessage(error: unknown): string {
    // Handle string errors
    if (typeof error === 'string') {
      return error
    }

    // Handle Axios errors
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<any>

      // Check response data for error message
      const responseData = axiosError.response?.data

      if (responseData) {
        // Try different common error message fields
        if (responseData.detail) {
          return String(responseData.detail)
        }
        if (responseData.error) {
          return String(responseData.error)
        }
        if (responseData.message) {
          return String(responseData.message)
        }
        if (responseData.msg) {
          return String(responseData.msg)
        }
      }

      // Use Axios error message
      if (axiosError.message) {
        return axiosError.message
      }

      // Fallback based on status code
      const statusCode = axiosError.response?.status
      if (statusCode) {
        return getStatusCodeMessage(statusCode)
      }

      return '서버 오류가 발생했습니다'
    }

    // Handle Error instances
    if (error instanceof Error) {
      return error.message
    }

    // Handle objects with message property
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message)
    }

    // Fallback
    return '알 수 없는 오류가 발생했습니다'
  }

  /**
   * Extract validation errors from error response
   * @param error - Error object
   * @returns Record of field: error message, or null if no validation errors
   */
  function extractValidationErrors(error: unknown): Record<string, string> | null {
    if (!isAxiosError(error)) {
      return null
    }

    const axiosError = error as AxiosError<any>
    const responseData = axiosError.response?.data

    if (!responseData) {
      return null
    }

    // Check common validation error formats
    const errors: Record<string, string> = {}

    // Format 1: { errors: { field: "message" } }
    if (responseData.errors && typeof responseData.errors === 'object') {
      return responseData.errors
    }

    // Format 2: { errors: [{ field: "field", message: "message" }] }
    if (Array.isArray(responseData.errors)) {
      responseData.errors.forEach((err: any) => {
        if (err.field && err.message) {
          errors[err.field] = err.message
        }
      })
      return Object.keys(errors).length > 0 ? errors : null
    }

    // Format 3: { detail: [{ loc: ["field"], msg: "message" }] } (FastAPI format)
    if (Array.isArray(responseData.detail)) {
      responseData.detail.forEach((err: any) => {
        if (err.loc && Array.isArray(err.loc) && err.msg) {
          const field = err.loc[err.loc.length - 1] // Last element is usually the field name
          errors[field] = err.msg
        }
      })
      return Object.keys(errors).length > 0 ? errors : null
    }

    return null
  }

  /**
   * Get detailed error information
   * @param error - Error object
   * @returns Error details object
   */
  function getErrorDetails(error: unknown): ErrorDetails {
    const message = translateErrorMessage(error)
    let statusCode: number | undefined
    let validationErrors: Record<string, string> | null = null
    let originalError: any = error

    if (isAxiosError(error)) {
      const axiosError = error as AxiosError
      statusCode = axiosError.response?.status
      validationErrors = extractValidationErrors(error)
    }

    const validationErrorsArray: ValidationError[] | undefined = validationErrors
      ? Object.entries(validationErrors).map(([field, message]) => ({
          field,
          message
        }))
      : undefined

    return {
      message,
      statusCode,
      validationErrors: validationErrorsArray,
      originalError
    }
  }

  /**
   * Check if error is an AxiosError
   */
  function isAxiosError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'isAxiosError' in error &&
      (error as any).isAxiosError === true
    )
  }

  /**
   * Get user-friendly message for HTTP status code
   */
  function getStatusCodeMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: '잘못된 요청입니다',
      401: '인증이 필요합니다',
      403: '접근 권한이 없습니다',
      404: '요청한 리소스를 찾을 수 없습니다',
      409: '충돌이 발생했습니다',
      422: '입력 데이터가 유효하지 않습니다',
      429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
      500: '서버 내부 오류가 발생했습니다',
      502: '게이트웨이 오류가 발생했습니다',
      503: '서비스를 일시적으로 사용할 수 없습니다',
      504: '게이트웨이 시간 초과'
    }

    return messages[statusCode] || `서버 오류가 발생했습니다 (${statusCode})`
  }

  /**
   * Check if error is a network error
   */
  function isNetworkError(error: unknown): boolean {
    if (!isAxiosError(error)) {
      return false
    }

    const axiosError = error as AxiosError
    return !axiosError.response && !!axiosError.request
  }

  /**
   * Check if error is a timeout error
   */
  function isTimeoutError(error: unknown): boolean {
    if (!isAxiosError(error)) {
      return false
    }

    const axiosError = error as AxiosError
    return axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')
  }

  return {
    translateErrorMessage,
    extractValidationErrors,
    getErrorDetails,
    isAxiosError,
    isNetworkError,
    isTimeoutError,
    getStatusCodeMessage
  }
}
