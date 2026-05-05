import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';

const renderWithAuth = (isAuthenticated: boolean) => {
  return render(
    <AuthContext.Provider
      value={{
        user: isAuthenticated
          ? { id: '1', name: 'User', email: 'user@test.com', role: 'COLLABORATOR' }
          : null,
        token: isAuthenticated ? 'token' : null,
        login: jest.fn(),
        logout: jest.fn(),
        isAuthenticated,
        isLoading: false,
      }}
    >
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Private content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};

describe('ProtectedRoute', () => {
  it('renders children for authenticated user', () => {
    renderWithAuth(true);
    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to login', () => {
    renderWithAuth(false);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
