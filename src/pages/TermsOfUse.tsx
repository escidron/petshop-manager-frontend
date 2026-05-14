import { Box, Container, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { ChevronRight, FileText } from "lucide-react";
import { LEGAL_CONTENT } from "../constants/legal";

const TermsOfUse = () => {
  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<ChevronRight size={16} />} 
          sx={{ mb: 4 }}
        >
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={16} /> Termos de Uso
          </Typography>
        </Breadcrumbs>

        <Box 
          sx={{ 
            bgcolor: "white", 
            p: { xs: 4, md: 8 }, 
            borderRadius: 4, 
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom fontWeight={900} color="primary.main">
            {LEGAL_CONTENT.terms.title}
          </Typography>
          
          {LEGAL_CONTENT.terms.content}
        </Box>
      </Container>
    </Box>
  );
};

export default TermsOfUse;
