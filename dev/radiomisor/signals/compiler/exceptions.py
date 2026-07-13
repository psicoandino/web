class CompilerError(Exception):
    pass


class ValidationError(CompilerError):
    pass


class EncodingError(CompilerError):
    pass


class DownloadError(CompilerError):
    pass
