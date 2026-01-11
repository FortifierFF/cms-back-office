// AppRoutes component - dynamically builds routes from configuration
// Maps route config to React Router routes with Secured wrapper
import { Routes, Route } from 'react-router-dom'
import routes from './index'
import Secured from '@/components/Secured'

export default function AppRoutes() {
  return (
    <Routes>
      {routes.map(({ layout: Layout, children }, index) => (
        <Route key={index} element={<Layout />}>
          {children.map(
            ({ path, authenticated, permissions, features, element: Element, ...rest }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Secured
                    path={path}
                    authenticated={authenticated}
                    permissions={permissions}
                    features={features}
                  >
                    <Element />
                  </Secured>
                }
                {...rest}
              />
            )
          )}
        </Route>
      ))}
    </Routes>
  )
}


