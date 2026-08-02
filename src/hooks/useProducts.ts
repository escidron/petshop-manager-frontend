import { useCallback, useEffect, useState } from "react"
import type { Product } from "../features/products/types"
import { fetchProducts } from "../api/services/products"

export function useProducts(excludeInternal: boolean = false) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await fetchProducts(excludeInternal))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return { products, loading, getProducts: loadProducts }
}
