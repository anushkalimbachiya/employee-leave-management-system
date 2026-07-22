from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to guarantee a consistent error
    envelope of the form: { "detail": "...", "errors": {...} }
    which makes it easy for the React frontend's axios interceptor / error
    boundary to render a single, predictable error message.
    """
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data
        if isinstance(data, dict) and "detail" not in data:
            # Field-level validation errors -> flatten into a readable detail
            first_key = next(iter(data))
            first_val = data[first_key]
            if isinstance(first_val, list):
                first_val = first_val[0]
            detail = f"{first_key}: {first_val}" if first_key != "non_field_errors" else str(first_val)
            response.data = {"detail": detail, "errors": data}
        elif isinstance(data, list):
            response.data = {"detail": str(data[0]) if data else "Invalid request.", "errors": data}

    return response
