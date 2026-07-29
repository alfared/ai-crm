import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";

import { login, type LoginRequest } from "../../features/auth/api/auth-api";
import { getApiErrorMessage } from "../../shared/api/get-api-error-message";
import { tokenStorage } from "../../shared/lib/auth/token-storage";
