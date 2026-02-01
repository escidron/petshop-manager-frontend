import { useCallback, useEffect, useState } from "react"
import type { Product } from "../pages/ProductsPage"
import { fetchProducts } from "../api/services/products"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await fetchProducts())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return { products, loading, getProducts: loadProducts }
}
